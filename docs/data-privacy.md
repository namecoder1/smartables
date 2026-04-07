# Data Privacy — Mappa PII e Procedure GDPR

Documento interno per sviluppatori. Complementa l'[Informativa sulla Privacy pubblica](/app/(public)/(legal)/privacy-policy/page.tsx) e i [Termini e Condizioni](/app/(public)/(legal)/terms-&-conditions/page.tsx).

---

## 1. Mappa dei Dati Personali (PII) nel Sistema

### Tabella `customers`
| Campo | Tipo PII | Note |
|-------|----------|------|
| `name` | Diretto | Nome del cliente finale del ristorante |
| `phone_number` | Diretto | Normalizzato in formato E.164 |
| `email` | Diretto | Opzionale |
| `bsuid` | Pseudonimo | WhatsApp Business-Scoped User ID (non corrisponde al numero di telefono reale) |
| `tags` | Comportamentale | Es. `["supplier"]` — derivato da azioni dell'utente |
| `metadata` | Vario | Può contenere `thefork_id`, preferenze alimentari, note staff |
| `bot_paused_until` | Comportamentale | Timestamp — indica handoff umano in corso |
| `total_visits`, `last_visit_at` | Comportamentale | Analytics aggregate |

**Proprietà**: Organization-scoped (ogni ristorante vede solo i propri clienti, RLS).

### Tabella `bookings`
| Campo | Tipo PII | Note |
|-------|----------|------|
| `guest_name` | Diretto | Anonimizzato a "Cliente eliminato" su richiesta GDPR |
| `guest_phone` | Diretto | Nullificato su richiesta GDPR |
| `customer_id` | FK | Nullificato su richiesta GDPR; booking conservata per analytics |
| `notes`, `allergies` | Sensibile | Possibili informazioni sulla salute (allergie) |

### Tabella `whatsapp_messages`
| Campo | Tipo PII | Note |
|-------|----------|------|
| `content` | Diretto | Testo dei messaggi scambiati |
| `customer_id` | FK | ON DELETE CASCADE — eliminato automaticamente con il cliente |

### Tabella `callback_requests`
| Campo | Tipo PII | Note |
|-------|----------|------|
| `phone_number` | Diretto | Stored direttamente (no FK a `customers`) — richiede eliminazione manuale |

### Tabella `telnyx_webhook_logs`
| Campo | Tipo PII | Note |
|-------|----------|------|
| `payload` | Possibile | Può contenere numeri di telefono del chiamante |

### Tabella `profiles` (utenti Smartables — non clienti dei ristoranti)
| Campo | Tipo PII | Note |
|-------|----------|------|
| `email` | Diretto | Gestito da Supabase Auth |
| `full_name` | Diretto | — |
| `role` | Organizzativo | `owner`, `admin`, `member` |

### Tabella `organizations`
| Campo | Tipo PII | Note |
|-------|----------|------|
| `billing_email` | Diretto | Email per fatturazione — può essere personale |
| `stripe_customer_id` | Pseudonimo | Stripe gestisce i dati di pagamento |

### Tabella `locations`
| Campo | Tipo PII | Note |
|-------|----------|------|
| `business_connectors` | Sensibile | Credenziali cifrate AES-256-GCM (TheFork, Google) — non PII ma dati sensibili |
| `telnyx_phone_number` | Aziendale | Numero del ristorante (non del cliente) |

---

## 2. Retention Policy

| Categoria | Retention | Base giuridica |
|-----------|-----------|----------------|
| Dati account (profiles, organizations) | Finché l'account è attivo + 30 giorni dopo cancellazione | Contratto |
| Dati clienti ristorante (customers, whatsapp_messages) | Finché non cancellati dal ristoratore o richiesta GDPR Art. 17 | Legittimo interesse del ristoratore |
| Bookings (anonimizzate) | Indefinito per analytics — PII rimosso su richiesta GDPR | Legittimo interesse |
| Dati fatturazione (transactions) | 10 anni | Obbligo legale italiano |
| Log di sistema (telnyx_webhook_logs) | 90 giorni (non implementato automaticamente — da aggiungere come cron) |  |
| Backup Supabase | 90 giorni (configurato su Supabase) | — |

---

## 3. Procedura di Cancellazione GDPR (Art. 17 — Diritto all'oblio)

Implementata in **`app/actions/customers.ts` → `deleteCustomers(ids[])`** (righe 92–188).

### Flusso a 4 step:
```
Step 1: Fetch phone_numbers dei clienti (necessari per Step 3)
Step 2: Anonymize bookings → guest_name="Cliente eliminato", guest_phone=null, customer_id=null
Step 3: Delete callback_requests by phone_number (no FK, eliminazione manuale)
Step 4: DELETE customers → cascade automatico su whatsapp_messages (ON DELETE CASCADE)
```

### Dati che restano nel sistema dopo la cancellazione:
- **Bookings anonimizzate**: Conservate per business analytics del ristorante senza PII
- **telnyx_webhook_logs**: Possono contenere il numero di telefono nel payload — non cascadano
- **Backup Supabase**: I dati eliminati persistono nei backup per 90 giorni

### Autorizzazione:
Solo utenti con `role = "admin"` o `role = "owner"` possono eliminare clienti (verificato lato server).

### Dove è esposta agli utenti:
- UI: Pagina clienti → selezione multipla → "Elimina selezionati"
- Non esiste ancora un endpoint pubblico self-service per i clienti finali dei ristoranti

---

## 4. Accesso ai Dati di Produzione

| Chi | Accesso | Livello |
|-----|---------|---------|
| Supabase service role key | Webhook handlers, server actions admin | Bypassa RLS — solo server-side |
| Supabase anon key | Client-side, RSC | Rispetta RLS |
| Sviluppatori Smartables | Dashboard Supabase (produzione) | Solo con autenticazione esplicita |
| GlitchTip (Sentry-compat) | Solo errori catturati esplicitamente | No accesso diretto al DB |
| Vercel | Variabili d'ambiente, log di deployment | No accesso al DB |

**Principio**: Nessun PII viene loggato direttamente nelle chiamate a `captureError/captureWarning`. I contesti includono `locationId`, `organizationId`, `customerPhone` solo dove strettamente necessario per il debug.

---

## 5. Trasferimenti Extra-UE

| Provider | Paese | Garanzia |
|----------|-------|----------|
| Supabase (AWS eu-west) | UE | — |
| Vercel | USA | SCC (Standard Contractual Clauses) |
| Stripe | USA | SCC |
| Meta / WhatsApp | USA | SCC |
| Telnyx | USA | SCC |
| OpenAI | USA | SCC — i messaggi WhatsApp vengono inviati a GPT-4o per le risposte AI |
| Resend | USA | SCC |
| Upstash Redis | UE (eu-west-1) | — |
| GlitchTip (self-hosted) | Server locale (Raspberry Pi via Tailscale) | — |

---

## 6. Gap da Risolvere

- [ ] **Retention automatica `telnyx_webhook_logs`**: Non c'è ancora un cron che pulisce i log > 90 giorni
- [ ] **Self-service cancellazione**: Non esiste un flusso per cui un cliente finale del ristorante possa richiedere la cancellazione direttamente (deve passare dal ristoratore)
- [ ] **Consent management**: Non c'è ancora un meccanismo di consenso esplicito per i messaggi WhatsApp automatici ai clienti dei ristoranti
