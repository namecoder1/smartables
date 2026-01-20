# 📘 Meta Developer Setup Guide (Smartables)

Questo documento spiega come configurare l'ambiente Meta per Smartables, specofico per l'uso dell'account esistente (Aggregator Mode/Review) con il numero landline `+390721...`.

## 1. Accesso e Verifica App

Assumo che tu abbia già creato l'App "Smartables" su [developers.facebook.com](https://developers.facebook.com/).

1.  Vai su **App Settings** -> **Basic**.
2.  Assicurati che **App Mode** sia `Development` per ora (o `Live` se hai già completato la Business Verification, ma per i test va bene Dev).
3.  Nel menu laterale, sotto **WhatsApp** -> **API Setup**, dovresti vedere un numero di test temporaneo. Noi configureremo il TUO numero reale.

---

## 2. Aggiungere il Numero Reale (+390721...)

Poiché il numero è un fisso (Landline), la verifica via SMS non funzionerà. Dobbiamo usare la chiamata vocale.

### A. Preparazione su Telnyx (Cruciale!)

Prima di cliccare su Meta, devi essere sicuro di poter rispondere alla chiamata.

1.  Il numero su Telnyx deve avere una **Voice Connection** attiva o un **Call Control App** collegato.
2.  **Opzione Rapida (Debug)**: Se non hai ancora il codice backend pronto per rispondere (`/webhook/telnyx`), puoi temporaneamente deviare le chiamate al tuo cellulare dal portale Telnyx (Call Forwarding).
    - _Telnyx Portal -> Numbers -> My Numbers -> Seleziona il numero -> Call Forwarding -> Inserisci il tuo cellulare._
    - _Obiettivo_: Quando Meta chiama il Fisso, Telnyx gira la chiamata al tuo cellulare e tu senti il codice.

### B. Procedura su Meta Business Suite

1.  Vai nelle **Impostazioni di WhatsApp Manager** (spesso accessibile da `API Setup` -> link in basso "Manage phone numbers").
2.  Clicca **Add Phone Number**.
3.  **Profile Info**:
    - **Display Name**: `Smartables` (o `Smartables Demo`).
    - **Category**: `Other` o `Restaurant Services`.
4.  **Verifica**:
    - Inserisci `+39 0721 1640267`.
    - Scegli **Phone Call** come metodo di verifica.
5.  **Clicca Next**.
6.  Meta chiamerà il numero. Se hai il forwarding attivo, rispondi e segna il codice a 6 cifre.
7.  Inserisci il codice. Fatto! Il numero è collegato.

---

## 3. Generazione Token Permanente (System User)

Il token temporaneo di 24h nella dashboard "API Setup" è inutile per il backend. Ti serve un System User.

1.  Vai su [Business Settings](https://business.facebook.com/settings).
2.  Menu laterale: **Users** -> **System Users**.
3.  Se non ne hai uno, clicca **Add**.
    - Name: `Smartables Backend`
    - Role: `Admin`
4.  Seleziona l'utente appena creato.
5.  Clicca **Add Assets**.
    - Seleziona **Apps** -> `Smartables` -> Attiva **Full Control**.
6.  Clicca **Generate New Token**.
    - App: `Smartables`.
    - Wanna expire? **Never**.
    - **Permissions** (Seleziona queste):
      - `whatsapp_business_management`
      - `whatsapp_business_messaging`
7.  Copia il token `EAAA...`.
8.  Incollalo nel file `.env` come `META_SYSTEM_USER_TOKEN`.

---

## 4. Configurazione Webhook

Per ricevere "Chiamata persa -> Invia WhatsApp" e le risposte dei clienti.

1.  Vai su **Developers Portal** -> **WhatsApp** -> **Configuration**.
2.  **Callback URL**: Deve essere un URL pubblico HTTPS.
    - In locale usa **Ngrok**: `https://tuo-id-ngrok.app/api/webhooks/meta`
    - In produzione: `https://app.smartables.com/api/webhooks/meta`
3.  **Verify Token**: Inventa una stringa (es. `smartables_secret_123`) e mettila nel `.env` come `META_WEBHOOK_SECRET`.
4.  Clicca **Verify and Save**. (Il tuo server deve essere acceso e rispondere 200 all'echo challenge, vedi codice step successivi).
5.  **Webhook Fields**: Clicca "Manage" e iscriviti a:
    - `messages` (per le risposte dei clienti)
    - (Opzionale) `message_template_status_update` (per sapere se i template sono approvati).

---

## 5. Primi ID da Salvare

Ora che tutto è connesso, vai su **WhatsApp** -> **API Setup** e segnati questi ID da mettere nel DB (o env per debug):

- **Existing WABA ID**: L'ID del Business Account (es. `1096...`).
- **Phone Number ID**: L'ID specifico del numero `+390721...` (Diverso dal numero di telefono stesso! è un ID tipo `3456...`).

Questi due valori, insieme al Token, sono le chiavi per inviare messaggi.
