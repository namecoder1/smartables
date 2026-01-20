# Strategia di Integrazione Meta: Account Proprietario vs Tech Provider

Questo documento analizza le opzioni architetturali per connettere i clienti Smartables a WhatsApp Business API, valutando i compromessi tra "Invisibilità" (UX) e "Compliance" (Meta Policy).

---

## 🚦 Executive Summary: La Risposta Breve

La domanda è: _I clienti devono usare il loro account Meta o usiamo il nostro?_

Esistono due strade principali:

1.  **Modello "Aggregator" (Tutto sul tuo Account)**:
    - **UX**: 100% Invisibile (Il cliente non fa nulla).
    - **Rischio**: Alto. Se un cliente vìola le regole, Meta può bannare l'intero account Smartables (e tutti gli altri clienti).
    - **Legal**: Zona grigia. Meta preferisce che ogni business abbia il suo WABA (WhatsApp Business Account).

2.  **Modello "Tech Provider" (Embedded Signup)**:
    - **UX**: Richiede 1 passaggio. Il cliente deve fare "Login with Facebook" una volta per autorizzare Smartables.
    - **Rischio**: Basso. Ogni cliente ha il suo WABA. Se uno viene bannato, gli altri sono salvi.
    - **Legal**: 100% Compliant. È la strada ufficiale per i SaaS (ISV).

---

## 🚀 Soluzione "Best of Both Worlds": Sviluppo Ibrido

Alla tua domanda: _"Posso provare subito con il mio account E nel frattempo preparare il terreno per il Tech Provider?"_
**La risposta è SÌ.**

Anzi, è il modo migliore di sviluppare. Ecco come strutturare l'architettura per supportare entrambi:

### 1. Codice Agnostico (La chiave di volta)

Le tue funzioni API (es. `sendMessage`, `verifyCode`) non devono mai leggere le chiavi da un file `.env` statico. Devono accettarle come parametri.

- **Invece di:** `const token = process.env.META_TOKEN;`
- **Fai così:** `const sendMessage = (text, to, { wabaId, token }) => { ... }`

### 2. Gestione dei Token nel Database

Nel DB `organizations` avremo due scenari:

- **Scenario DEMO / PROPRIETARIO (Oggi)**:
  - `waba_id`: Il TUO WABA ID.
  - `access_token`: Il TUO System User Token (che non scade mai).
- **Scenario TECH PROVIDER (Domani)**:
  - `waba_id`: Il WABA ID del Cliente (ottenuto via OAuth).
  - `access_token`: Il Token del Cliente (ottenuto via OAuth).

**Risultato:** Il codice del backend è identico per entrambi. Cambia solo _da dove_ pesca le credenziali nel DB.

---

## 📋 Requisiti per Diventare "Meta Tech Provider"

Diventare Tech Provider non è automatico. Richiede una procedura burocratica ("Business Verification").

### Cosa ti serve (Documenti):

1.  **Visura Camerale**: Smartables S.r.l. (o P.IVA) deve esistere legalmente.
2.  **Proof of Address**: Una bolletta, estratto conto o lettera ufficiale intestata all'azienda che mostri l'indirizzo e il numero di telefono aziendale.
3.  **Sito Web**: Un sito funzionante che cita il nome legale dell'azienda.
4.  **App Review**: Meta vorrà vedere un video o testare il flusso "Login with Facebook" per approvare i permessi avanzati (`whatsapp_business_management`, `whatsapp_business_messaging`).

### Tempistiche

- **Business Verification**: 1-3 settimane (a volte rognosa se i documenti non combaciano alla perfezione).
- **App Review**: 3-5 giorni lavorativi.

### Strategia Consigliata

1.  **Parti SUBITO col tuo account (Aggregator Mode)** per sviluppare e fare le prime demo. Non ti serve nessuna verifica speciale.
2.  Lancia la pratica di **Business Verification** in parallelo (puoi farlo dal Business Manager -> Security Center).
3.  Quando la verifica è passata, implementa il bottone "Login with Facebook".

---

## 🔍 Analisi Dettagliata (Riferimento)

### Opzione A: Modello "Aggregator" (Single WABA)

In questo scenario, **Smartables S.r.l.** possiede un unico WhatsApp Business Account (WABA). Quando un ristorante si iscrive, Smartables compra un numero e lo aggiunge al _proprio_ WABA, impostando come "Display Name" il nome del ristorante.

#### ✅ Vantaggi

- **Invisibilità Totale**: Il ristoratore paga te e basta. Non deve avere Facebook, non deve fare login, non deve accettare termini Meta.
- **Speed to Market**: Più veloce da implementare oggi (nessun flusso OAuth complesso).

#### ❌ Svantaggi & Rischi

- **Single Point of Failure**: Se un ristorante invia spam e il "Quality Rating" del numero scende, impatta la reputazione del WABA Smartables. Nel caso peggiore, Meta revoca l'accesso API a Smartables, spegnendo _tutti_ i clienti.
- **Display Name Issues**: Meta verifica i Display Name. Potrebbe chiedere: "Perché l'azienda Smartables S.r.l. vuole un numero chiamato 'Trattoria da Luigi'?". Dovresti fornire documenti che provano la relazione (contratto firmato), rallentando il processo.
- **Messaging Limits**: I limiti di messaggi (1k/24h, 10k/24h) sono condivisi o legati al tier del WABA principale.

---

### Opzione B: Modello "Tech Provider" (Embedded Signup)

In questo scenario, Smartables diventa un **Meta Tech Provider**. Integriamo il flusso "Embedded Signup" (una finestra popup gestita da Facebook).

#### ⚙️ Il Flow Tecnico

1.  Il Ristoratore entra nella Dashboard Smartables.
2.  Clicca "Attiva WhatsApp".
3.  Si apre un popup Facebook: "Vuoi continuare come Mario Rossi?".
4.  Lui seleziona (o crea al volo) un WABA per il suo ristorante.
5.  Condivide i permessi (WABA ID e Phone Number ID) con Smartables.
6.  Smartables (via API) inietta il numero Telnyx nel suo WABA e gestisce tutto.

#### ✅ Vantaggi

- **Scale & Safety**: Ogni ristorante è isolato. Il ban di uno non tocca gli altri.
- **Proprietà**: Il ristorante "possiede" il suo asset (il canale WhatsApp). Se un domani lascia Smartables, potrebbe teoricamente portarsi via lo storico (GDPR friendly).
- **Pagamenti Meta**: Il costo dei messaggi (Service Conversations) può essere pagato direttamente dalla carta di credito che il cliente inserisce nel popup Meta (oppure da te tramite "Solution Partner" credit line, ma è più complesso).

#### ❌ Svantaggi

- **Frizione UX**: Richiede che il ristoratore abbia (o crei) un account Facebook/Meta Business Suite. Per target "ristoratori vecchio stampo", questo è un ostacolo.

---
