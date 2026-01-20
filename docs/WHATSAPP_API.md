# Guida alla Configurazione API WhatsApp (Meta + Telnyx)

Questa guida descrive come integrare l'API di WhatsApp Business (Cloud API) utilizzando **Telnyx** come provider di numeri telefonici. È strutturata per un caso d'uso **SaaS/Platform**, dove i clienti acquistano numeri tramite la tua piattaforma e questi vengono automaticamente collegati a WhatsApp.

## Panoramica del Flusso

1.  **Acquisto Numero**: Smartables acquista un numero su Telnyx per conto del cliente.
2.  **Registrazione su Meta**: Smartables usa le API di Meta per aggiungere quel numero al WhatsApp Business Account (WABA).
3.  **Verifica (OTP Handshake)**:
    - Meta invia un OTP al numero (via SMS o Chiamata).
    - Il numero (gestito da Telnyx) riceve l'OTP.
    - Smartables intercetta l'OTP tramite Webhook Telnyx.
    - Smartables invia l'OTP a Meta per completare la verifica.
4.  **Operativo**: Il numero è attivo e può inviare/ricevere messaggi.

---

## 1. Prerequisiti

### Meta (Facebook Developers)

- **App Meta**: Tipo "Business".
- **WhatsApp Business Account (WABA)** associato all'app.
- **System User**: Un utente di sistema con ruolo "Admin" sul WABA.
- **Access Token**: Token permanente generato dal System User con permessi `whatsapp_business_management` e `whatsapp_business_messaging`.

### Telnyx

- **Account Telnyx**: Con fondi disponibili.
- **API Key V2**: Per acquistare numeri e gestire le configurazioni.
- **Messaging Profile**: Un profilo pre-configurato su Telnyx che punta al tuo Webhook (es: `https://api.smartables.com/api/webhooks/telnyx`).

---

## 2. Configurazione Automatica (Flusso per i Clienti)

Il flusso corretto e consigliato per la tua piattaforma SaaS è il seguente:

#### Fase A: Verifica Identità Utente (Già esistente)

- L'utente si registra/accede alla piattaforma.
- Verifica il suo **numero personale/esistente** tramite OTP (per sicurezza account).
- _Questo step è slegato da Meta/Telnyx API, serve solo a te per identificare l'utente._

#### Fase B: Attivazione Canale WhatsApp Business (Nuovo Numero)

Una volta che l'utente è verificato e decide di attivare il servizio WhatsApp:

1.  **Acquisto Numero Telnyx**: La piattaforma compra un _nuovo_ numero dedicato su Telnyx.
2.  **Registrazione Meta**: La piattaforma registra questo _nuovo_ numero su Meta.
3.  **Verifica Meta**: Meta invia l'OTP al _nuovo_ numero -> La piattaforma lo riceve via API Telnyx -> La piattaforma lo conferma a Meta.

**Perché questo doppio passaggio è corretto?**

- **Sicurezza**: Distingui l'identità del cliente (numero personale) dallo strumento di lavoro (numero API).
- **Affidabilità**: Se Meta banna il numero API, l'utente può ancora accedere al tuo SaaS col suo numero personale.
- **Tecnica**: L'API di WhatsApp Business funziona meglio con numeri "puliti" e dedicati, gestiti interamente via software.

---

### Dettaglio Step Tecnici (Fase B)

Questo è il processo "invisibile" che il backend deve gestire per attivare il servizio.

### Step 1: Acquisto Numero (Telnyx)

Usa la funzione esistente in `lib/telnyx.ts` per acquistare un numero.
**Importante**: Assicurati che il numero supporti **SMS** o **Voice** per ricevere l'OTP.

```typescript
// Esempio logico
const number = await purchasePhoneNumber("+393331234567");
```

### Step 2: Registrazione Numero su Meta (WABA)

Aggiungi il numero al WhatsApp Business Account.

**Endpoint**: `POST https://graph.facebook.com/v22.0/{waba_id}/phone_numbers`

**Body**:

```json
{
  "cc": "39",
  "phone_number": "3331234567", // Senza prefisso intl, solo locale
  "verified_name": "Nome Attività Cliente" // Deve essere approvato da Meta
}
```

> **Nota**: Il `verified_name` (Display Name) potrebbe richiedere una revisione da parte di Meta.

### Step 3: Richiesta Codice di Verifica (OTP)

Meta deve verificare che tu possieda il numero. Richiedi l'invio del codice.

**Endpoint**: `POST https://graph.facebook.com/v22.0/{phone_number_id_from_step_2}/request_code`

**Body**:

```json
{
  "code_method": "SMS", // Oppure "VOICE" se il numero non supporta SMS
  "language": "it"
}
```

### Step 4: Intercettazione OTP (Webhook Telnyx)

Quando Meta invia l'SMS, Telnyx lo riceve e chiama il tuo Webhook.
Devi creare un endpoint (es. `/api/webhooks/telnyx`) che parsa il messaggio in arrivo.

**Payload Webhook Telnyx (Semplificato)**:

```json
{
  "data": {
    "event_type": "message.received",
    "payload": {
      "text": "123-456 è il tuo codice di verifica WhatsApp...",
      "from": { "phone_number": "MetaNumber" },
      "to": { "phone_number": "+393331234567" }
    }
  }
}
```

_Il tuo backend deve estrarre "123456" dal testo._

### Step 5: Conferma Codice

Invia il codice estratto a Meta per completare il collegamento.

**Endpoint**: `POST https://graph.facebook.com/v22.0/{phone_number_id}/verify_code`

**Body**:

```json
{
  "code": "123456"
}
```

---

## 3. Configurazione Webhooks

### A. Webhook Telnyx (Inbound)

Serve per:

1.  Ricevere l'OTP di verifica da Meta.
2.  Ricevere SMS generici (se supportati, ma per WhatsApp Cloud API i messaggi utente NON passano da qui, passano dal Webhook Meta).

Configura nel portale Telnyx (Messaging Profiles) l'URL: `https://tuo-dominio.com/api/webhooks/telnyx`

### B. Webhook Meta (Messaggistica WhatsApp)

Serve per ricevere i messaggi che gli utenti inviano su WhatsApp al numero business.

Configura nella Dashboard Meta App -> WhatsApp -> Configuration:

- **Callback URL**: `https://tuo-dominio.com/api/webhooks/whatsapp`
- **Verify Token**: Una stringa segreta a tua scelta (che dovrai validare nel codice).
- **Webhooks fields**: Iscriviti a `messages`.

---

## 4. Checklist Sviluppo

1.  [ ] **`lib/meta.ts`**: Crea funzioni per interagire con Graph API (add number, request code, verify code).
2.  [ ] **`app/api/webhooks/telnyx/route.ts`**: Crea endpoint per ricevere SMS da Telnyx e riconoscere i pattern OTP di Meta.
3.  [ ] **`app/api/webhooks/whatsapp/route.ts`**: Crea endpoint per ricevere messaggi WhatsApp dagli utenti finali.
4.  [ ] **UI Setup**: Pagina dove il cliente inserisce il nome display e lancia la procedura di acquisto/verifica.

---

## Risorse Utili

- [Meta Cloud API - Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Telnyx API Documentation](https://developers.telnyx.com/api/v2/messaging)
