# 🚀 Prossimi Step - Smartables MVP

Questo documento traccia i passi necessari per completare la Fase 1 dell'MVP (Intercettazione Chiamata & Conversione).

## 1. Configurazione Telnyx V2 (Managed Accounts) 📞

> **Nota**: Con la nuova architettura, non usiamo più il conto master per i numeri finali, ma un **Managed Account** per ogni Organizzazione.

- [ ] **API Keys**: Ottenere le chiavi API del conto MASTER e aggiungerle a `.env.local`:
  ```bash
  TELNYX_API_KEY=LaChiaveMaster
  ```
- [ ] **Create Managed Account**:
  - Implementare logica backend per creare un sub-account Telnyx (`telnyx_managed_account_id`) alla creazione dell'Organizzazione.
- [ ] **Regulatory Requirements**:
  - Implementare flow UI per caricare documenti (Carta d'identità, Visura).
  - Backend: Caricare documenti su Telnyx API e creare un `Bundle Request`.
- [ ] **Acquisto Numero**:
  - Solo DOPO l'approvazione del Bundle, permettere l'acquisto del numero linkato al `telnyx_managed_account_id`.
- [ ] **Webhook Setup**:
  - Configurare l'URL webhook livello Master o per singola App controllata.
  - URL: `https://[DOMINIO]/api/telnyx/voice`

## 2. Dashboard "Manage Activities" 🛠️

- [ ] **Integrazione Acquisto Numeri (Opzionale per ora)**:
  - Modificare `app/(private)/(organization)/manage-activities/page.tsx` (o view) per permettere all'utente di cercare numeri disponibili usando `searchAvailableNumbers` di `lib/telnyx.ts`.
  - Aggiungere un bottone "Acquista Numero Smart" che usa `purchasePhoneNumber` e salva il risultato (`telnyx_phone_number`) nella tabella `locations`.

## 3. Integrazione WhatsApp (Meta) 💬

- [ ] **Verifica Business Manager**: Il numero Telnyx deve essere registrato e verificato nel Meta Business Manager per usare WhatsApp APIs.
- [ ] **Libreria WhatsApp**:
  - Creare `lib/whatsapp.ts` per gestire l'invio di messaggi (Template Messages).
- [ ] **Trigger Messaggio**:
  - Aggiornare `app/api/telnyx/voice/route.ts`. Dopo aver rifiutato la chiamata (`rejectCall`), attivare l'invio del messaggio WhatsApp:
  ```typescript
  // Esempio logico
  await rejectCall(callId);
  await sendWhatsAppTemplate(callerNumber, "template_chiamata_persa", {
    link: bookingLink,
  });
  ```

## 4. Pagina di Prenotazione Pubblica (Il Link) 🌐

Per l'MVP, invece di un complesso WhatsApp Flow, usiamo una pagina web ottimizzata mobile.

- [ ] **Nuova Pagina**: Creare `app/prenota/[locationSlug]/page.tsx` (o `[id]`).
- [ ] **Booking Form**:
  - Deve essere super semplice: Nome, Persone, Ora.
  - Deve scrivere nella tabella `bookings` con `status='pending'` e `source='whatsapp_auto'`.
- [ ] **Redirect**: Dopo la prenotazione, mostra una pagina di conferma "Grazie! Ti aspettiamo".

## 5. Testing & Verifica 🔄

1. **Chiamata**: Chiama il numero Smart.
2. **Rifiuto**: Il telefono NON deve squillare (o fare un busy tone immediato).
3. **SMS/WA**: Ricevi il link sul cellulare.
4. **Prenotazione**: Apri il link, prenoti.
5. **Dashboard**: Il ristoratore vede la prenotazione in `app/(private)/(platform)/reservations/page.tsx`.
