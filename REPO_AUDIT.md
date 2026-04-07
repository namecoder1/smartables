# REPO AUDIT — Enterprise & Acquisition Readiness
> Smartables | Marzo 2026 | Da usare con Claude Code per uno scan completo della repo

---

## Contesto

Smartables è una piattaforma SaaS multi-tenant B2B per ristoranti italiani indipendenti.
Stack: Next.js 16 App Router, TypeScript, Supabase (PostgreSQL), Trigger.dev v4, Telnyx, Meta WhatsApp Cloud API, Stripe, Vercel.

**Stato attuale noto:**
- Test coverage ~60%
- Logging con GlitchTip in fase di aggiunta sui punti sensibili
- Nessun ADR formale ancora presente
- `MASTER.md` come documento di prodotto/architettura principale (già esistente)

---

## Obiettivo di questo audit

Fare un **punto della situazione completo** della repo rispetto agli standard di una codebase professionale enterprise/acquisition-ready.

Per ogni area elencata sotto, devi:
1. **Scansionare la repo** per verificare cosa esiste già
2. **Valutare la qualità** di quanto trovato (non solo presenza/assenza)
3. **Identificare i gap** specifici con riferimento ai file/directory coinvolti
4. **Proporre le azioni** concrete da fare, con priorità

Output finale: un report strutturato con una **tabella di stato** per area e una **lista di task priorizati** pronti per essere eseguiti.

---

## AREA 1 — Documentazione Tecnica Operativa

### Cosa cercare nella repo:
- Esiste una directory `/docs`? Cosa contiene?
- Esiste un `CONTRIBUTING.md`?
- Esiste un `SECURITY.md`?
- Esiste un `CHANGELOG.md`?
- Esistono commenti inline nei file critici (webhook handlers, anti-spam logic, billing, OTP flow)?
- Esiste un `env.example` o `.env.example`? È completo e commentato?

### Standard atteso — ADR (Architecture Decision Records):
Ogni decisione architetturale non ovvia deve avere un file `/docs/adr/NNN-titolo.md` con:
```
# ADR-001: Agency Model — Single WABA Account

## Status
Accepted

## Context
[Perché si è presentato il problema]

## Decision
[Cosa abbiamo deciso]

## Consequences
[Trade-off, rischi, implicazioni operative]
```

**Decisioni da documentare in ADR per Smartables (lista di partenza):**
- `001` — Agency model: singolo account WABA Meta invece di Embedded Signup per ogni cliente
- `002` — Singolo account Telnyx invece di Managed Sub-accounts
- `003` — Trigger.dev invece di Cron Vercel per i background job
- `004` — Anti-spam 24h non configurabile per sede (invariante di sistema, non setting)
- `005` — `bot_paused_until` scoped a `customer_id` (e implicazioni note)
- `006` — OTP vocale via Whisper per verifica numero VoIP (unico path, no SMS fallback)
- `007` — Flat subscription vs pay-per-use per i limiti WhatsApp
- `008` — WhatsApp come canale primario (vs SMS o email)

### Standard atteso — Commenti inline:
Il commento utile spiega il **perché**, non il **cosa**. Esempio corretto:

```ts
// Anti-spam: blocco rigido a 24h, non esposto come setting per sede.
// Il WABA è condiviso tra tutti i clienti (agency model): un abuso
// su un numero può generare un ban che colpisce l'intero account.
// La soglia è un invariante del sistema, non una preferenza configurabile.
if (hoursSince(lastMessageAt) < 24) return;
```

**File prioritari da verificare e commentare:**
- `app/api/webhooks/telnyx/route.ts` — logica anti-spam, call rejection, usage check
- `app/api/webhooks/whatsapp/route.ts` — handoff umano, bot_paused_until
- `trigger/verify-booking.ts` — wait.until(), pre/post-check status
- `app/actions/compliance/` — flusso approvazione Telnyx
- `lib/billing/` — usage cap, reset mensile, proration
- Qualsiasi file che tocca `whatsapp_usage_count`

### Standard atteso — `/docs/environment.md`:
Per ogni variabile d'ambiente:
```md
### TELNYX_API_KEY
- **Tipo**: Secret
- **Scope**: Server-side only
- **Ottenere**: Dashboard Telnyx → API Keys → Create Key
- **Ambienti**: Dev (test key), Prod (live key) — mai condividere
- **Se mancante**: Il webhook handler crasha con 500 al primo event
- **Rotation**: Semestrale raccomandata
```

---

## AREA 2 — CHANGELOG e Versionamento

### Cosa cercare nella repo:
- Esiste un `CHANGELOG.md` in root?
- Esiste un `VERSIONING.md` o strategia documentata?
- Esiste una convenzione per i commit message (Conventional Commits)?
- I tag Git sono presenti e coerenti?

### Standard atteso:
`CHANGELOG.md` in formato [Keep a Changelog](https://keepachangelog.com):
```md
# Changelog

## [Unreleased]
### Added
- ...

## [0.8.0] - 2026-03-15
### Added
- TheFork webhook handler con OAuth2 e JWT verification
- Upgrade/Downgrade in-app con proration Stripe
### Fixed
- bot_paused_until scoped a customer_id invece di conversation context
### Known Issues
- Bot non ha accesso a disponibilità real-time (roadmap: tool calling)
```

---

## AREA 3 — Testing

### Cosa cercare nella repo:
- Struttura delle directory di test (dove sono i test? `__tests__`? `*.test.ts`?)
- Cosa è testato? Unit, integration, E2E?
- Esistono fixture per i payload webhook (Telnyx, Meta)?
- I test sono leggibili come specifiche? (naming convention)
- Esiste configurazione per coverage report?
- Esiste Playwright o altro framework E2E?

### Gap prioritari da identificare:

**Contract testing per webhook** — verifica che i fixture dei payload corrispondano a quello che Telnyx/Meta mandano realmente:
```
__fixtures__/
  telnyx-call-initiated.json
  telnyx-call-hangup.json
  telnyx-requirement-approved.json
  meta-message-inbound.json
  meta-message-status-update.json
  stripe-invoice-payment-succeeded.json
```

**Naming convention test** — i test devono essere leggibili come specifiche:
```ts
// ✅ Corretto
it('should not send WhatsApp if last message was within 24 hours')
it('should increment whatsapp_usage_count after successful template send')
it('should stop verify-booking task if booking status is not pending')

// ❌ Da evitare
it('anti spam test')
it('works correctly')
```

**Happy-path E2E minimi** (Playwright):
1. Login → redirect dashboard
2. Creazione prenotazione manuale → appare in lista
3. Webhook Telnyx simulato → booking creato con source `whatsapp_auto`
4. Stripe webhook `invoice.payment_succeeded` → usage counter resettato

### Metriche da riportare:
- Coverage attuale per directory (non solo globale)
- Aree con 0% coverage (da identificare)
- Test che coprono i flussi core A-G del MASTER.md

---

## AREA 4 — CI/CD Pipeline

### Cosa cercare nella repo:
- Esiste `.github/workflows/`? Cosa contiene?
- C'è un workflow di CI (lint + type-check + test)?
- C'è Dependabot configurato (`.github/dependabot.yml`)?
- C'è secret scanning attivo?
- Esistono branch protection rules documentate?

### Standard atteso — workflow CI minimo:
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    steps:
      - TypeScript type-check (tsc --noEmit)
      - ESLint
      - Vitest / Jest con coverage report
      - Next.js build check
```

### Standard atteso — Dependabot:
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      dev-dependencies:
        patterns: ["@types/*", "eslint*", "vitest*"]
```

---

## AREA 5 — Observability

### Cosa cercare nella repo:
- Come è implementato il logging attuale? `console.log`? Logger strutturato?
- GlitchTip: dove è inizializzato? Quali aree sono già coperte?
- Esiste un endpoint `/api/health`?
- I log includono context strutturato (location_id, organization_id, event_type)?
- Esistono runbook per incident response?

### Standard atteso — Logger strutturato:
Ogni log dovrebbe includere context minimo per il debug in produzione:
```ts
logger.info('webhook.telnyx.call_rejected', {
  event_type: 'call.initiated',
  location_id: location.id,
  caller_phone: from,
  reason: 'anti_spam_24h',
  last_message_at: lastMessage?.created_at,
})

logger.error('whatsapp.template_send_failed', {
  location_id: location.id,
  customer_phone: to,
  template_name: 'missed_call_recovery',
  meta_error_code: error.code,
  meta_error_message: error.message,
})
```

**Context da includere sempre nei log sensibili:**
- `location_id` e `organization_id`
- Tipo di evento
- Risultato (success/failure + reason)
- Timing dove rilevante

### Standard atteso — Health check:
```ts
// GET /api/health
{
  "status": "ok",
  "version": "0.8.0",          // da package.json
  "db": "connected",            // ping Supabase
  "timestamp": "2026-03-30T...",
  "uptime_seconds": 3600
}
```

### Runbook da creare (priorità):
```
/docs/runbooks/
  waba-ban-response.md       ← cosa fare se Meta sospende il WABA
  telnyx-webhook-down.md     ← cosa fare se i webhook smettono di arrivare
  usage-cap-hit.md           ← procedura quando un cliente raggiunge il limite WA
  compliance-rejection.md    ← cosa fare se Telnyx rigetta i documenti
```

---

## AREA 6 — Secrets & Environment

### Cosa cercare nella repo:
- Esiste `.env.example` completo?
- Ci sono secret hardcoded da rimuovere? (scan con `git log -S "sk_" --all`)
- Le variabili sono organizzate per provider?
- Esiste una startup validation delle env obbligatorie?

### Standard atteso — Startup check:
```ts
// lib/env-check.ts — eseguito all'avvio del server
const REQUIRED_ENV = [
  'TELNYX_API_KEY',
  'TELNYX_WEBHOOK_SECRET',
  'META_ACCESS_TOKEN',
  'META_PHONE_NUMBER_ID',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'OPENAI_API_KEY',
]

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}
```

---

## AREA 7 — Data & Compliance (GDPR)

### Cosa cercare nella repo:
- Esiste documentazione interna su quali PII sono nel DB?
- Esiste una retention policy definita per i messaggi WhatsApp?
- Esiste un meccanismo di cancellazione dati cliente (GDPR right to erasure)?
- La Privacy Policy pubblica è allineata con quanto il sistema fa davvero?

### Gap da identificare:
- Tabella `whatsapp_messages`: quanto a lungo si conservano? Chi può accederci?
- Tabella `customers`: phone_number è PII — come viene gestita la cancellazione?
- I dati di `telnyx_regulatory_requirements` (documenti identità): dove sono stored? Chi ha accesso?
- Esiste una route o action per `DELETE /api/customers/:id` con cascade su tutti i dati?

### Standard atteso — Data flow interno:
```
/docs/data-privacy.md
  - Mappa dei dati PII nel sistema
  - Retention policy per categoria (messaggi, prenotazioni, documenti compliance)
  - Procedura di cancellazione (GDPR Art. 17)
  - Chi ha accesso a produzione DB
  - Backup policy
```

---

## AREA 8 — Sicurezza

### Cosa cercare nella repo:
- I webhook Telnyx e Meta hanno signature verification?
- Le route pubbliche (`/p/[locationSlug]`, `/order/[locationSlug]/[tableId]`) hanno rate limiting?
- Le API route protette verificano sempre l'appartenenza all'organizzazione (RLS + server-side check)?
- Esistono input sanitization / validation con Zod su tutti gli endpoint pubblici?
- Esiste `SECURITY.md`?

### Check specifici per Smartables:
```ts
// ✅ Webhook Telnyx — verifica HMAC signature
// Da verificare: è implementato su tutti i webhook o solo alcuni?

// ✅ Meta webhook — verifica X-Hub-Signature-256
// Da verificare: è robusta contro timing attacks?

// ⚠️ Public booking form — rate limiting attivo?
// Un attore malevolo può creare migliaia di prenotazioni false

// ⚠️ /order/[locationSlug]/[tableId] — chi può vedere gli ordini?
// La route è pubblica by design o dovrebbe avere un token temporaneo?
```

### Standard atteso — `SECURITY.md`:
```md
# Security Policy

## Reporting a Vulnerability
Non aprire una issue pubblica. Invia email a security@smartables.it.
Risposta entro 48h per confermare receipt.

## Scope
In scope: autenticazione, gestione dati PII, webhook integrity, billing
Out of scope: DoS, social engineering

## Supported Versions
Solo la versione corrente in produzione riceve patch di sicurezza.
```

---

## OUTPUT — Ultimo Aggiornamento

Scansione eseguita il **7 Aprile 2026**. Basata sull'analisi dei file reali nella repo.  
*Prima scansione: 2 Aprile 2026. Delta aggiornato al 7 Aprile 2026.*

---

### 1. Tabella di Stato per Area

| Area | Stato | Note |
|------|--------|------|
| Documentazione / ADR | 🟢 | 8 ADR in `docs/adr/`. `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md` presenti. `docs/environment.md` (244 righe). 4 runbook in `docs/runbooks/`. `docs/data-privacy.md` presente. |
| CHANGELOG / Versioning | 🟢 | Keep a Changelog, versioni da 0.1.0 a [Unreleased]. Commit message non seguono Conventional Commits (aperto). |
| Testing | 🟢 | **707 test** unit (55 file), tutti verdi. Fixtures per Stripe/Telnyx/WhatsApp in `tests/__fixtures__/`. Playwright E2E: 32 test (21 pass, 11 skipped per env slug). Coverage v8 configurato. Copertura flussi A-G verificata con `tests/flows/`. |
| CI/CD Pipeline | 🟡 | `ci.yml` completo (tsc + lint + vitest + next build). Dependabot configurato. `playwright.yml` presente ma mancano env var nel workflow CI — Playwright E2E in CI fallisce su pagine Supabase-dipendenti. |
| Observability | 🟡 | GlitchTip/Sentry inizializzato, `lib/monitoring.ts` strutturato, `/api/health` ok. 4 runbook presenti. `console.error` residuo in `lib/push-notifications.ts:51` — da sostituire con `captureError`. |
| Secrets / Environment | 🟢 | `.env.example` con 65+ variabili commentate. `lib/env-check.ts` con fail-fast. `docs/environment.md` documentato (244 righe). Nessun segreto hardcoded. |
| Data & GDPR | 🟢 | `deleteCustomers()` a 4 step con anonimizzazione. `docs/data-privacy.md` presente (141 righe) con mappa PII, retention policy, procedura Art. 17. |
| Sicurezza | 🟢 | Telnyx: Ed25519 + replay window. WhatsApp: HMAC-SHA256 + `timingSafeEqual`. Rate limiting Upstash su booking/order/flow. Honeypot su form pubblici. Zod validation su tutti i form pubblici. |

**Legenda**: 🔴 Assente/Critico · 🟡 Parziale · 🟢 Adeguato

---

### 2. Task List — Stato Aggiornato

| Task | Priorità | Effort | Stato |
|------|----------|--------|-------|
| Completare `docs/environment.md` | Alta | S | ✅ Fatto (244 righe) |
| Creare `docs/data-privacy.md` | Alta | S | ✅ Fatto (141 righe) |
| Creare 4 runbook incident response | Alta | M | ✅ Fatto (`docs/runbooks/`) |
| Configurare Playwright E2E | Media | M | ✅ Fatto (32 test, 21 pass) |
| Eliminare `console.error` residui | Media | XS | ⬜ Aperto — 1 in `lib/push-notifications.ts:51` |
| Fix `playwright.yml` env var in CI | Alta | XS | ⬜ Aperto — 30min, aggiungere GitHub Secrets |
| TheFork Fase 3 (status pushback) | Alta | L | ⬜ Aperto — richiede docs API Partner |
| WhatsApp Flow verify E2E staging | Alta | M | ⬜ Aperto — test manuale via ngrok |
| Adottare Conventional Commits | Bassa | XS | ⬜ Aperto |
| Commenti inline file critici (T06) | Bassa | M | ⬜ Aperto — `call.ts`, `messages.ts`, `verify-booking.ts` |

---

### 3. Open Items — Dettaglio

---

#### [PRIORITÀ: ALTA] Fix `playwright.yml` — env var in CI

**File**: `.github/workflows/playwright.yml`  
**Effort**: XS (30 min)  
**Problema**: Il workflow lancia `npm run dev` in CI senza passare env var. Le pagine che chiamano Supabase restituiscono errore. I test smoke/auth passano ma quelli su `/` (landing, che chiama `createAdminClient`) potrebbero fallire.  
**Fix**: Aggiungere `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` come GitHub Secrets e passarli al workflow, oppure puntare Playwright verso il deployment Vercel preview con `baseURL: ${{ env.VERCEL_PREVIEW_URL }}`.

---

#### [PRIORITÀ: ALTA] TheFork Fase 3 — Status Pushback

**File**: `app/actions/bookings.ts`, nuovo `lib/thefork-api.ts`  
**Effort**: L (richiede docs API TheFork Partner)  
**Problema**: Quando il ristoratore cambia lo stato di una prenotazione TheFork in Smartables (es. `arrived`, `no_show`, `cancelled`), TheFork non viene notificato. Il DB ha già `thefork_access_token`, `thefork_token_expires_at`, `thefork_client_id/secret` nella tabella `locations`.  
**Fix**: In `updateBooking()`, dopo l'update locale, se `booking.source === 'thefork'` e `booking.external_id` è presente, chiamare l'API TheFork per aggiornare lo stato. Aggiungere refresh automatico del token OAuth se scaduto.

---

#### [PRIORITÀ: ALTA] WhatsApp Flow — Verifica E2E in Staging

**File**: `app/api/webhooks/whatsapp-flow/route.ts`  
**Effort**: M (dipende da accesso staging Meta)  
**Problema**: La route implementa decryption RSA+AES, gestione `ping`/`INIT`/`date_selection`/`time_selection`, ma non è mai stata testata con payload reali Meta.  
**Come testare**:
1. `npm run ngrok` → URL pubblico su `localhost:3000`
2. Meta Business Manager → WhatsApp → Flows → endpoint = URL ngrok
3. Inviare manualmente il template con FLOW button al numero di test
4. Completare il flow su WhatsApp e verificare la prenotazione nel DB

---

#### [PRIORITÀ: MEDIA] Eliminare `console.error` residuo

**File**: `lib/push-notifications.ts:51`  
**Effort**: XS (5 min)  
**Fix**: Sostituire `console.error("[sendPushToOrganization] Failed:", err)` con `captureError(err, { service: "expo", flow: "push_notification_send" })`.

---

#### [PRIORITÀ: BASSA] Adottare Conventional Commits

**File**: `.github/workflows/ci.yml`, nuovo `commitlint.config.js`  
**Effort**: XS  
**Fix**: Installare `commitlint` + `@commitlint/config-conventional`, aggiungere step in CI che valida i commit message su PR. Non retroattivo.

---

### 4. Stato Copertura Flussi Core (da MASTER.md)

| Flusso | Descrizione | Test |
|--------|-------------|------|
| A — Missed Call Recovery | Chiamata persa → WA automatico → prenotazione | ✅ `tests/flows/flow-a-missed-call.test.ts` |
| B — Onboarding VoIP | Compliance → acquisto numero → OTP verifica | ✅ `tests/flows/flow-b-billing-lifecycle.test.ts` |
| C — No-Show Killer | Trigger.dev verify-booking → annullamento automatico | ✅ `tests/flows/flow-c-noshowkiller.test.ts` |
| D — Prenotazione Manuale | Dashboard → booking → notify | ✅ `tests/actions/bookings.test.ts` |
| E — Bot AI Conversazionale | WA in arrivo → OpenAI → risposta | ✅ `tests/flows/flow-e-bot-ai.test.ts` |
| F — Prenotazione Pubblica | `/p/[slug]` → form → booking | ✅ `tests/flows/flow-f-public-booking.test.ts` |
| G — Menu Digitale & QR Order | `/order/[slug]/[tableId]` → comanda | ✅ `tests/flows/flow-g-public-order.test.ts` |
| H — Template WABA Custom | Wizard → Meta API → invio | ✅ `tests/actions/branding.test.ts` (parziale) |

---

## Note per auditor futuro

- **Non inventare** lo stato di copertura: scansiona i file reali, leggi il contenuto, poi valuta.
- Se un file esiste ma è vuoto o boilerplate, segnalalo come 🔴 non come 🟢.
- Quando trovi codice che manca di commenti sul "perché", indicalo con percorso e riga approssimativa.
- Per i test, verifica non solo la presenza ma il naming e la copertura dei flussi A-H.
- Riferisci sempre ai path concreti della repo, non a path ipotetici.
- `STATUS.md` in `/Developer/smartables/` è il documento di riferimento aggiornato per lo stato operativo.