# 🇮🇹 Smartables - Intelligent Table Recovery

## Vision: The Core Concept

**Smartables** non è un gestionale classico. È un layer di intelligenza artificiale "**Invisible-First**" che si posiziona sopra i processi esistenti del ristorante per risolvere i due problemi più costosi del settore:

1.  **Chiamate Perse (Revenue Loss)**: Durante il servizio (20:00-22:00) il personale è occupato e non risponde al telefono. I clienti chiamano il concorrente.
2.  **No-Show (Revenue Waste)**: Le prenotazioni prese a voce non hanno garanzie. Il cliente non si presenta e il tavolo resta vuoto.

**La Soluzione**: Un sistema automatizzato che intercetta le chiamate senza risposta tramite deviazione telefonica e converte il cliente in una prenotazione confermata tramite **WhatsApp Flows**, senza richiedere app o siti esterni.

---

## How It Works

Il sistema orchestra tre flussi principali che popolano la tabella `bookings`.

### A. Il Flusso "Recupero Automatico" (WhatsApp Flows)

_Scenario: Sabato sera, caos in sala. Telefono occupato._

1.  **Trigger**: Il cliente chiama il ristorante.
2.  **Intercettazione**: La rete (codice `*67*`) devia su **Telnyx**.
3.  **Reject**: Il sistema rifiuta la chiamata (Costo 0 per il cliente, nessun "Tu-Tu").
4.  **Engage (Utility)**: Parte un WhatsApp immediato: _"Ciao! Non riusciamo a rispondere a voce, ma puoi prenotare subito qui sotto 👇"_.
5.  **Conversion (Flow)**: Cliccando "Prenota", si apre un form nativo in WhatsApp (Next.js decrypta il payload e mostra gli slot liberi basati su `locations.opening_hours` e `bookings` esistenti).
6.  **Conferma**: Il cliente conferma. Il DB salva su `bookings` con `source='whatsapp_auto'`.

### B. Il Flusso "Ibrido Manuale" (Dashboard)

_Scenario: Il ristoratore risponde al telefono._

1.  **Input**: Apre la Dashboard (iPad/Tablet).
2.  **Inserimento**: Digita i dati.
3.  **Smart Toggle**: Seleziona **[Nuovo]** o **[Abituale]**.
    - **Abituale**: Salva e basta.
    - **Nuovo**: Salva e innesca il flusso di Reminder (vedi punto C).

### C. Il "No-Show Killer" (Reminder & Garanzia)

_Scenario: 24h prima della prenotazione._

1.  **Job**: Un worker scansiona `bookings` per lo stato `pending`.
2.  **Azione**: Invia WhatsApp interattivo: _"Confermi per domani alle 20:00?"_.
3.  **Interazione**:
    - **[SÌ]** -> Status diventa `confirmed`.
    - **[NO]** -> Status diventa `cancelled`, lo slot torna libero.
    - _(Roadmap)_: Se il tavolo è > X persone, il Flow richiede carta di credito a garanzia (Stripe Pre-auth).

---

## Business Model (Wallet System)

Abbandono del SaaS flat in favore del modello **Prepagato a Consumo (Credits)**. Il ristoratore acquista "coperti garantiti" come acquista la farina.

- **Valuta**: Crediti salvati in `organizations.credits`.
- **Pricing**: ~0.30€ per interazione (Recupero o Reminder).
- **Marginalità**:
  - Costo Meta: ~0.04€ (Utility) / 0.00€ (Service).
  - Costo Telnyx: Irrisorio (solo webhook request).
  - **Netto**: ~0.25€ a transazione.
- **Billing**: Ricarica pacchetti (50€, 100€, 200€) via Stripe. Transazioni tracciate in `transactions`.

---

## Technical Architecture

Struttura Monolite Modulare ottimizzata per scalabilità e Exit Strategy.

### Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI/UX**: Shadcn/UI + Tailwind CSS (Mobile-first)
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand (gestione multi-location/org)
- **Telefonia**: Telnyx Voice (Webhook only strategy) + **Managed Accounts** (Compliance)
- **Messaging**: Meta WhatsApp Cloud API + WhatsApp Flows (`node:crypto` per cifratura payload)
- **Payments**: Stripe (Checkout per ricariche, Portal per fatturazione)

### Database Schema V2 (Compliance-First)

Il DB è strutturato per supportare Multi-Tenant, Multi-Location e **VoIP Compliance** (normativa italiana/europea).

> **Vedi `docs/NEW_ARCH.md` per i dettagli sull'architettura Managed Accounts.**

Il DB è strutturato per supportare il Multi-Tenant e il Multi-Location nativamente.

| Tabella                          | Descrizione                                                                          |
| :------------------------------- | :----------------------------------------------------------------------------------- |
| `organizations`                  | L'entità di fatturazione + **Telnyx Managed Account**.                               |
| `locations`                      | Le sedi fisiche. Linkate a `regulatory_requirements` per la compliance VoIP.         |
| `telnyx_regulatory_requirements` | **[NEW]** Gestione documenti e bundle approvati per Area Code.                       |
| `profiles`                       | Lo staff, collegato all'Organization (RBAC: Admin/Staff).                            |
| `bookings`                       | Il cuore del sistema. Linkata a `location_id` e `customer_id`.                       |
| `customers`                      | CRM condiviso a livello di Organizzazione (riconoscimento cliente su tutte le sedi). |
| `menus/menu_items`               | Struttura per Menu Digitale (integrabile nel Flow WhatsApp in Fase 2).               |
| `transactions`                   | Ledger immutabile per il consumo crediti e audit log.                                |

---

## Development Roadmap

Questa roadmap è disegnata per arrivare all'MVP vendibile e, successivamente, all'Exit.

### 🟢 FASE 1: The Core (MVP Funzionale)

_Obiettivo: Intercettare la chiamata e mandare un messaggio._

- [x] Setup Next.js + Supabase + Shadcn.
- [x] Implementazione Auth (Supabase) + Verifica OTP WhatsApp.
- [x] **Meta Production Setup**: Migrato da Sandbox a WABA Reale ("Smartables").
- [x] **Telnyx Number**: Numero locale (+39 0721...) acquistato e verificato tramite Chiamata Vocale.
- [ ] **Telnyx Webhook**: Endpoint `/api/telnyx/voice` che rifiuta chiamata e triggera WhatsApp.
- [ ] **Meta Integration**: Template `test_tobi` creato (pending approval), invio dinamico.
- [ ] **Billing Lite**: Assegnazione crediti manuale/bonus all'iscrizione.

### 🟡 FASE 2: The Flow (Conversione)

_Obiettivo: Prendere la prenotazione senza intervento umano._

- [ ] **Flow UI**: Disegno del JSON per WhatsApp Flow (Date/Time picker).
- [ ] **Flow Encryption**: Endpoint `/api/flows` per gestire handshake crittografico con Meta.
- [ ] **Availability Logic**: Query su `bookings` per mostrare solo slot liberi.
- [ ] **Dashboard**: Vista lista prenotazioni per il ristoratore.

### 🔴 FASE 3: The Wallet (Monetizzazione)

_Obiettivo: Automatizzare l'incasso._

- [ ] **Stripe Checkout**: Acquisto pacchetti crediti.
- [ ] **Credit Consumption**: Logic che scala 0.30€ da `organizations.credits` a ogni invio.
- [ ] **Auto-Recharge**: Trigger per ricarica automatica sotto soglia.

### 🔵 FASE 4: The Bridge (Exit Strategy)

_Obiettivo: Rendere il prodotto appetibile per acquisizione._

- [ ] **GCal Sync**: Sincronizzazione bidirezionale con Google Calendar.
- [ ] **Public API**: Documentare endpoint puliti per permettere a terzi di iniettare prenotazioni.

---

## SWOT Analysis

- **Strengths**: UX invisibile (no app), Setup rapido (solo deviazione chiamata), Costi variabili (no canone fisso).
- **Weaknesses**: Dipendenza forte da Meta/Telnyx.
- **Opportunities**: Vendita come "Modulo aggiuntivo" a gestionali esistenti (TeamSystem, Zucchetti).
- **Threats**: Ban del numero WhatsApp (Mitigazione: uso rigoroso di template Utility e rispetto policy).

> **Nota Legale**: Per dettagli sulla compliance con P.IVA Forfettaria e verifica Meta/Telnyx, vedi l'appendice in `docs/META_STRATEGY.md`.
