# WhatsApp & Telnyx Integration — Production Flow

Questo documento spiega come funziona il flusso di integrazione WhatsApp/Telnyx in **produzione**.

---

## Variabili d'Ambiente Necessarie

| Variabile                      | Dove trovarla                                                               |
| ------------------------------ | --------------------------------------------------------------------------- |
| `TELNYX_API_KEY`               | [Telnyx Portal](https://portal.telnyx.com/) → API Keys                      |
| `TELNYX_CONNECTION_ID`         | Telnyx Portal → SIP Connections (la connessione voice)                      |
| `META_SYSTEM_USER_TOKEN`       | [Meta Business](https://business.facebook.com/) → System Users → Token      |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta Business → WhatsApp → Business Account ID                              |
| `OPENAI_API_KEY`               | [OpenAI](https://platform.openai.com/) → API Keys (per trascrizione vocale) |
| `RESEND_API_KEY`               | [Resend](https://resend.com/) → API Keys (per email notifica)               |

---

## Webhook Necessari

### Telnyx Webhook

- **URL**: `https://tuodominio.com/api/webhooks/telnyx`
- **Dove configurarlo**: Telnyx Portal → SIP Connections → la tua connessione → Webhook URL
- **Eventi gestiti**:
  - `requirement_group.status_updated` — aggiornamento stato regulatory
  - `call.initiated` — chiamata in arrivo (per rispondere)
  - `call.recording.saved` — registrazione salvata (per trascrivere il codice)

> ⚠️ **IMPORTANTE**: In locale, Telnyx non può raggiungere `localhost`. Usa un tunnel come [ngrok](https://ngrok.com/) o [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) per esporre il tuo server locale.

---

## Flusso Completo (Step by Step)

### Step 1 — Utente: Invio Documenti

- **Pagina**: `/compliance`
- L'utente compila il form con dati anagrafici, indirizzo e documenti (tessera sanitaria + prova indirizzo).
- I file vengono caricati su Supabase Storage (`compliance-docs`).
- Lo stato diventa **`pending_review`**.

### Step 2 — Admin: Approvazione

- **Pagina**: `/manage`
- L'admin verifica i documenti nella sezione "Pending Compliance Reviews".
- Cliccando **Approve**, il sistema:
  1. Scarica i documenti da Supabase Storage.
  2. Li carica su Telnyx (`uploadDocument`).
  3. Crea un indirizzo Telnyx (`createAddress`).
  4. Crea un **Requirement Group** su Telnyx (`createRequirementGroup`).
- Telnyx risponde con status **`unapproved`** (in attesa di revisione interna Telnyx).
- Lo stato nel DB viene mappato a **`pending`**.

### Step 3 — Telnyx: Revisione Regulatory (24-48h)

- Telnyx esamina i documenti internamente.
- Quando completato, invia un webhook `requirement_group.status_updated` con status `approved` o `rejected`.
- Il webhook handler (`/api/webhooks/telnyx`) aggiorna lo stato nel DB.

### Step 4 — Automatico: Acquisto Numero + Meta

Se lo status è `approved`, il webhook handler automaticamente:

1. **Acquista un numero** Telnyx (`purchasePhoneNumber`) — 💰 costa circa $1/mese.
2. **Aggiunge il numero a Meta WABA** (`addNumberToWaba`).
3. **Richiede codice di verifica vocale** da Meta (`requestVerificationCode` con metodo `VOICE`).
4. Aggiorna la location nel DB con `meta_phone_id` e `activation_status: 'active'`.

### Step 5 — Automatico: Verifica Vocale

Meta chiama il numero Telnyx con un codice di verifica vocale. Il sistema:

1. **Risponde alla chiamata** (`answerCall`) — webhook `call.initiated`.
2. **Registra l'audio** (`startRecording`).
3. Quando la registrazione è pronta (webhook `call.recording.saved`):
   - **Trascrive l'audio** con OpenAI Whisper (`transcribeAudio`).
   - **Estrae il codice** a 6 cifre (`extractVerificationCode`).
   - **Registra il numero su Meta** (`registerNumberWithMeta`).
4. Aggiorna lo stato della location a **`verified`**.

### Step 6 — Utente: Personalizzazione WhatsApp

- **Pagina**: `/compliance` (dopo verifica)
- L'utente vede il form **"Personalizza Profilo WhatsApp"** (BrandingForm).
- Può impostare nome, descrizione e immagine del profilo WhatsApp Business.

---

## Bottoni Admin Dashboard (`/manage`)

| Bottone                  | Cosa fa                                 | Quando usarlo                                              |
| ------------------------ | --------------------------------------- | ---------------------------------------------------------- |
| **Force Purchase**       | Acquista realmente il numero su Telnyx  | Se il webhook di approvazione non ha triggerato l'acquisto |
| **Force Add to Meta**    | Aggiunge il numero al WABA Meta         | Se l'acquisto è andato bene ma l'aggiunta a Meta è fallita |
| **Re-trigger Real Call** | Richiede un nuovo codice vocale da Meta | Se la prima chiamata non è andata a buon fine              |
| **Trash Location**       | Elimina la location dal DB              | Per cleanup/testing                                        |

---

## Problemi Comuni

### 1. Webhook non ricevuti

- **Causa**: URL del webhook non raggiungibile (localhost).
- **Soluzione**: Usa ngrok (`ngrok http 3000`) e aggiorna l'URL nel portale Telnyx.

### 2. `TELNYX_API_KEY is not set`

- **Causa**: Variabile d'ambiente mancante.
- **Soluzione**: Controlla `.env.local` e riavvia il server.

### 3. `The parameter verified_name is required` (Meta)

- **Causa**: Il campo `verified_name` non viene inviato nella richiesta di aggiunta numero.
- **Soluzione**: Assicurati che `addNumberToWaba` invii sia `display_name` che `verified_name`.

### 4. `Invalid Call Control ID` (Telnyx)

- **Causa**: Il `call_control_id` non è valido o è scaduto.
- **Soluzione**: Questo accade se la chiamata è già terminata. Controlla i log per confermare che la chiamata è stata ricevuta.

### 5. Codice di verifica non estratto

- **Causa**: La trascrizione OpenAI non ha trovato un codice a 6 cifre.
- **Soluzione**: Controlla la qualità della registrazione. Eventualmente ritenta con **Re-trigger Real Call**.

### 6. Fondi insufficienti su Telnyx

- **Causa**: Il saldo Telnyx è troppo basso per acquistare un numero.
- **Soluzione**: Ricarica il saldo sul [portale Telnyx](https://portal.telnyx.com/).

### 7. Requirement Group rejected

- **Causa**: Telnyx ha rifiutato i documenti (dati non validi, foto illeggibile, ecc.).
- **Soluzione**: L'utente deve ricaricare documenti corretti. Lo stato torna a `rejected` e il form riappare.
