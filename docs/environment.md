# Environment Variables

Documentazione completa di tutte le variabili d'ambiente di Smartables.  
Il file di riferimento per i valori è `.env.example` nella root del progetto.

---

## Supabase

### NEXT_PUBLIC_SUPABASE_URL
- **Tipo**: URL — `[REQUIRED] [PUBLIC]`
- **Scope**: Client e server
- **Ottenere**: Dashboard Supabase → Project Settings → API → Project URL
- **Se mancante**: L'app non si avvia — il client Supabase non si inizializza
- **Rotation**: Non applicabile (URL statico del progetto)

### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Tipo**: JWT — `[REQUIRED] [PUBLIC]`
- **Scope**: Client e server (accesso con RLS)
- **Ottenere**: Dashboard Supabase → Project Settings → API → `anon` key
- **Se mancante**: Nessuna query DB lato client funziona
- **Rotation**: Via Dashboard Supabase → Project Settings → API → Rotate Keys

### SUPABASE_SERVICE_ROLE_KEY
- **Tipo**: JWT — `[REQUIRED] [SECRET]`
- **Scope**: Solo server-side (webhook handlers, server actions, admin client)
- **Ottenere**: Dashboard Supabase → Project Settings → API → `service_role` key
- **⚠️ Attenzione**: Bypassa RLS completamente. Mai esporre al client o loggare.
- **Se mancante**: I webhook handler e le server action admin crashano
- **Rotation**: Semestrale raccomandata — aggiornare anche su Vercel

---

## Stripe

### STRIPE_SECRET_KEY
- **Tipo**: Secret — `[REQUIRED] [SECRET]`
- **Scope**: Solo server-side
- **Ottenere**: Dashboard Stripe → Developers → API keys → Secret key (live)
- **Se mancante**: Nessuna operazione Stripe funziona (checkout, webhook, ecc.)
- **Rotation**: Annuale raccomandata

### STRIPE_SECRET_KEY_TEST
- **Tipo**: Secret — `[OPTIONAL] [SECRET]`
- **Scope**: Solo server-side (sviluppo locale)
- **Ottenere**: Dashboard Stripe → Developers → API keys → Secret key (test)
- **Se mancante**: Sviluppo locale degradato (usa la live key se presente)
- **Rotation**: Non necessaria

### STRIPE_WEBHOOK_KEY
- **Tipo**: Webhook signing secret — `[REQUIRED] [SECRET]`
- **Scope**: Solo server-side (`app/api/webhooks/stripe/route.ts`)
- **Ottenere**: Dashboard Stripe → Developers → Webhooks → endpoint live → Signing secret
- **Se mancante**: Tutti i webhook Stripe falliscono con 400 (firma non verificata)
- **Rotation**: Via Dashboard Stripe → Revoke e rigenerare

### STRIPE_WEBHOOK_KEY_TEST
- **Tipo**: Webhook signing secret — `[OPTIONAL] [SECRET]`
- **Scope**: Solo server-side (sviluppo locale con `npm run stripe`)
- **Ottenere**: Output di `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- **Se mancante**: `npm run stripe` in locale non verifica le firme

### NEXT_PUBLIC_STRIPE_PRICE_* (piano base)
- **Tipo**: Price ID — `[REQUIRED] [PUBLIC]`
- **Scope**: Client e server (UI pricing, checkout)
- **Ottenere**: Dashboard Stripe → Product catalog → seleziona piano → Price ID (`price_...`)
- **Variabili**: `STARTER_MONTH`, `STARTER_YEAR`, `PRO_MONTH`, `PRO_YEAR`, `BUSINESS_MONTH`, `BUSINESS_YEAR`
- **Se mancante**: La pagina pricing non mostra i prezzi; il checkout fallisce

### STRIPE_PRICE_ADDON_*
- **Tipo**: Price ID — `[REQUIRED] [SECRET]`
- **Scope**: Solo server-side (gestione addon subscription)
- **Variabili**: `STAFF`, `CONTACTS_WA`, `STORAGE`, `LOCATION`, `KB`, `ANALYTICS`, `CONNECTIONS`
- **Ottenere**: Dashboard Stripe → Product catalog → seleziona addon → Price ID
- **Se mancante**: L'acquisto/rimozione di addon fallisce

### STRIPE_SETUP_FEE_PRICE_ID / NEXT_PUBLIC_ENABLE_SETUP_FEE
- **Tipo**: Price ID / Flag booleano — `[OPTIONAL]`
- **Default**: `false` (disabilitato)
- **Usare**: Impostare `NEXT_PUBLIC_ENABLE_SETUP_FEE=true` per abilitare il setup fee al checkout

---

## Meta / WhatsApp Business API

### META_SYSTEM_USER_TOKEN
- **Tipo**: Bearer token — `[REQUIRED] [SECRET]`
- **Scope**: Solo server-side (invio messaggi, registrazione numeri)
- **Ottenere**: Meta Business Manager → System Users → crea/seleziona System User → Generate Token (con permessi `whatsapp_business_messaging`, `whatsapp_business_management`)
- **Se mancante**: Nessun messaggio WhatsApp viene inviato; la registrazione numeri fallisce
- **Rotation**: I System User token non scadono, ma revocare e rigenerare se compromesso

### META_APP_SECRET
- **Tipo**: Secret — `[REQUIRED] [SECRET]`
- **Scope**: Solo server-side (verifica firma `X-Hub-Signature-256` sui webhook)
- **Ottenere**: Meta for Developers → App → Settings → Basic → App Secret
- **Se mancante**: La verifica della firma webhook viene saltata (captureWarning in GlitchTip), ma i webhook continuano a funzionare. In produzione deve essere sempre presente.
- **Rotation**: Via Dashboard Meta → Regenerate App Secret (aggiornare anche webhook endpoint)

### WHATSAPP_APP_ID
- **Tipo**: ID — `[REQUIRED] [SECRET]`
- **Ottenere**: Meta for Developers → seleziona App → App ID in alto

### WHATSAPP_BUSINESS_ACCOUNT_ID
- **Tipo**: ID — `[REQUIRED] [SECRET]`
- **Ottenere**: Meta Business Manager → WhatsApp → Overview → WhatsApp Business Account ID

### WHATSAPP_PHONE_NUMBER_ID
- **Tipo**: ID — `[OPTIONAL] [SECRET]`
- **Note**: Phone ID di default per test. In produzione, ogni sede ha il proprio `meta_phone_id` nel DB.

### WHATSAPP_WEBHOOK_VERIFY_TOKEN
- **Tipo**: Secret arbitrario — `[REQUIRED] [SECRET]`
- **Scope**: Server-side (verifica GET su `/api/webhooks/whatsapp`)
- **Ottenere**: Scegliere un valore random, inserirlo anche in Meta Dashboard → WhatsApp → Webhooks → Verify Token
- **Se mancante**: Meta non riesce a verificare l'endpoint webhook; i webhook non vengono inviati

### WHATSAPP_PRIVATE_KEY
- **Tipo**: RSA Private Key (PEM) — `[REQUIRED] [SECRET]`
- **Scope**: Server-side (decifratura payload WhatsApp Flow)
- **Ottenere**: Generare localmente con `openssl genrsa -out private.pem 2048`, caricare la chiave pubblica su Meta → WhatsApp Flows → Encryption
- **Se mancante**: Il webhook `/api/webhooks/whatsapp-flow` restituisce 500 su ogni richiesta

### WHATSAPP_BOOKING_FLOW_ID
- **Tipo**: ID — `[REQUIRED] [SECRET]`
- **Ottenere**: Meta for Developers → WhatsApp → Flows → seleziona il flow di prenotazione → Flow ID
- **Se mancante**: I bottoni "Prenota" nel template missed_call non aprono il flow

---

## Telnyx

### TELNYX_API_KEY
- **Tipo**: API Key — `[REQUIRED] [SECRET]`
- **Scope**: Server-side (acquisto numeri, call control, compliance)
- **Ottenere**: Telnyx Portal → Auth → API Keys → Create Key
- **Se mancante**: Tutte le operazioni Telnyx API falliscono (acquisto numeri, compliance)
- **Rotation**: Annuale raccomandata

### TELNYX_CONNECTION_ID
- **Tipo**: ID — `[REQUIRED] [SECRET]`
- **Ottenere**: Telnyx Portal → Voice → Call Control Applications → seleziona app → ID
- **Se mancante**: I numeri acquisiti non sono associati all'app Call Control; le chiamate non vengono gestite

### TELNYX_WEBHOOK_PUBLIC_KEY
- **Tipo**: Ed25519 Public Key (base64) — `[REQUIRED] [SECRET]`
- **Scope**: Server-side (`lib/telnyx-verify.ts` — verifica firma webhook)
- **Ottenere**: Telnyx Portal → Auth → API Keys → sezione "Webhook Signing"
- **Se mancante**: Tutti i webhook Telnyx vengono rifiutati con 400

---

## OpenAI

### OPENAI_API_KEY
- **Tipo**: API Key — `[REQUIRED] [SECRET]`
- **Scope**: Server-side
- **Ottenere**: platform.openai.com → API Keys → Create new key
- **Usato per**: Whisper (trascrizione OTP vocale), GPT-4o (bot AI risposta messaggi)
- **Se mancante**: OTP vocale non funziona; il bot AI non risponde ai messaggi
- **Rotation**: Annuale raccomandata

---

## Resend (email transazionali)

### RESEND_API_KEY
- **Tipo**: API Key — `[REQUIRED] [SECRET]`
- **Scope**: Server-side (Stripe webhook, notifiche compliance)
- **Ottenere**: resend.com → API Keys → Create API Key
- **Se mancante**: Nessuna email transazionale viene inviata (pagamento fallito, account sospeso, ecc.)
- **Rotation**: Annuale raccomandata

---

## Upstash Redis (rate limiting)

### UPSTASH_REDIS_REST_URL
- **Tipo**: URL — `[REQUIRED] [SECRET]`
- **Scope**: Server-side (`lib/ratelimit.ts`)
- **Ottenere**: console.upstash.com → Database → REST API → URL
- **Se mancante**: Il rate limiting fallisce silenziosamente (le richieste passano); potenziale abuso delle form pubbliche

### UPSTASH_REDIS_REST_TOKEN
- **Tipo**: Token — `[REQUIRED] [SECRET]`
- **Scope**: Server-side
- **Ottenere**: console.upstash.com → Database → REST API → Token
- **Se mancante**: Come sopra

---

## Google Calendar

### GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- **Tipo**: OAuth2 credentials — `[REQUIRED] [SECRET]`
- **Scope**: Server-side (OAuth flow per connessione Google Calendar)
- **Ottenere**: Google Cloud Console → Credentials → OAuth 2.0 Client IDs → Web Application
- **Se mancante**: L'integrazione Google Calendar non può autenticarsi

---

## Trigger.dev (background jobs)

### TRIGGER_SECRET_KEY
- **Tipo**: Secret — `[REQUIRED] [SECRET]`
- **Scope**: Server-side (dispatch dei task `verify-booking`, `reply-to-message`, `request-review`)
- **Ottenere**: cloud.trigger.dev → Project → API Keys → Secret Key
- **Se mancante**: Nessun task background viene dispatchato (nessuna verifica prenotazione, nessuna risposta AI, nessuna richiesta review)
- **Rotation**: Se compromessa, rigenerare e aggiornare su Vercel

---

## Security (encryption)

### BUSINESS_CONNECTORS_ENCRYPTION_KEY
- **Tipo**: Base64 (32 bytes AES-256) — `[REQUIRED] [SECRET]`
- **Scope**: Server-side (cifratura credenziali TheFork, Google, ecc. nel DB)
- **Ottenere**: `openssl rand -base64 32`
- **⚠️ Critico**: Se persa o cambiata, tutte le credenziali dei connettori nel DB diventano illeggibili e le integrazioni smettono di funzionare
- **Rotation**: Non ruotare senza una procedura di re-encryption di tutti i record nel DB

---

## Error Monitoring (GlitchTip/Sentry)

### NEXT_PUBLIC_SENTRY_DSN
- **Tipo**: URL DSN — `[OPTIONAL] [PUBLIC]`
- **Scope**: Client e server (`instrumentation.ts`, `sentry.*.config.ts`)
- **Ottenere**: GlitchTip self-hosted → Project → Settings → DSN
- **Se mancante**: Il monitoring è completamente disabilitato (nessun errore arriva a GlitchTip). L'app funziona normalmente.

---

## App URLs

### NEXT_PUBLIC_APP_URL
- **Tipo**: URL — `[REQUIRED] [PUBLIC]`
- **Valore produzione**: `https://app.smartables.it`
- **Usato in**: Link nelle email transazionali, fallback nel bot AI

### NEXT_PUBLIC_SITE_URL
- **Tipo**: URL — `[REQUIRED] [PUBLIC]`
- **Valore produzione**: `https://smartables.it`
- **Usato in**: Link al sito marketing, redirect pubblici
