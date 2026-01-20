# 📞 Telnyx Managed Accounts Setup

Guida operativa per abilitare e gestire i Managed Accounts su Telnyx nel contesto Smartables.

## 1. Abilitazione Managed Accounts (Step Zero)

Questa feature è spesso "Gate-kept" (nascosta) su account standard per motivi di sicurezza.

### Verifica se è attiva

1.  Vai sul [Telnyx Portal](https://portal.telnyx.com/).
2.  Controlla se nel menu a sinistra esiste la voce **Managed Accounts**.
3.  Se NON c'è, devi richiederla.

### Come richiederla (Script per Chat/Email)

Invia questo a `support@telnyx.com` o nella chat live:

> **Subject**: Request access to Managed Accounts feature (SaaS Platform)
>
> Hi Team,
>
> I am developing "Smartables", a SaaS platform for restaurants in Italy. I need to manage phone numbers and regulatory compliance on behalf of my customers using **Managed Accounts** to keep their data and billing isolated.
>
> My account email is: [TUA EMAIL TELNYX]
>
> Could you please enable the Managed Accounts feature for my master account? I have already successfully tested standard numbers and I am ready to implement the multi-tenant architecture.
>
> Thank you.

---

## 2. Architettura & Flow (Dopo abilitazione)

Una volta attivo, la gerarchia diventa:

1.  **Master Account** (Tu): Ha l'API Key principale.
2.  **Managed Account** (Il Ristorante): Creato via API, "figlio" del Master.
3.  **Phone Number**: Acquistato _dentro_ il Managed Account.

### API Flow per Onboarding Cliente

Ecco la sequenza di chiamate API da implementare in `lib/telnyx.ts`:

#### A. Creazione Account Gestito

`POST https://api.telnyx.com/v2/managed_accounts`

```json
{
  "business_name": "Pizzeria Da Mario",
  "email": "mario@pizzeria.it", // Email fittizia o reale del cliente
  "manager_account_id": "TUO_ID_MASTER" // Opzionale, lo deduce dal token di solito
}
```

- **Response**: Ricevi un `id` (es. `ma_12345...`) e una `api_token` specifica per quell'account (salvala criptata nel DB!).

#### B. Assegnazione Indirizzo (Compliance)

Per comprare numeri Italiani locali, serve l'indirizzo nel Managed Account, NON nel Master.

`POST https://api.telnyx.com/v2/requirements` (Usando il TOKEN del Managed Account appena creato)

- Carichi i documenti (Address Proof + Identity Proof).
- Crei un `requirement_group` associato al Managed Account.

#### C. Acquisto Numero

`POST https://api.telnyx.com/v2/number_orders` (Usando il TOKEN del Managed Account)

- Compri il numero. Poiché il Requirement Group è nel Managed Account, il matching è automatico.

---

## 3. Strategia di Sviluppo Ibrido

Poiché useremo il tuo account per la demo:

**Scenario DEMO (Oggi)**:

- Saltiamo la creazione Managed Account.
- Usiamo la tua API Key Master `TELNYX_API_KEY` dal `.env`.
- Usiamo il numero `+390721...` che è nel tuo Master Account.

**Scenario PROD (Domani)**:

- Il codice controllerà: `Organization` ha un `telnyx_managed_account_id`?
  - **SI**: Usa il token del Managed Account.
  - **NO**: Fallback sul token Master (per backward compatibility o admin).
