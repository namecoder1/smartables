# Guida ai Managed Accounts per Smartables

### 1. Conviene usare un Managed Account?

**Sì, assolutamente.** Per una piattaforma SaaS (Software as a Service) come la tua, i vantaggi sono determinanti:

* **Isolamento Totale:** Ogni ristorante avrà il suo "sotto-account". Se un cliente ha problemi di pagamento o legali, colpisce solo il suo account e non l'intera piattaforma Smartables.
* **Billing Separato:** Puoi decidere se pagare tu per tutti (Rollup Billing) o se far inserire la carta di credito direttamente al ristoratore.
* **Compliance Semplificata:** Ogni "Requirement Group" per la legge italiana viene associato al singolo sotto-account del ristorante, rendendo tutto più pulito per Telnyx.

---

### 2. Devo chiudere il mio account attuale?

**No, non devi chiuderlo.** Il tuo account attuale diventerà il **Manager Account** (l'account "padre").
Tuttavia, c'è una limitazione tecnica importante da sapere:

* **Nessun Trasferimento:** Telnyx **non permette** di spostare numeri o configurazioni già esistenti (come il numero di Pesaro che stai comprando) all'interno di un nuovo Managed Account creato in seguito.
* **Cosa significa per te:** Il numero che stai comprando ora rimarrà nel tuo account "Padre". Per i futuri clienti, creerai dei Managed Account e comprerai i numeri direttamente lì dentro.

---

### 3. Come attivare i Managed Accounts

Attualmente, la funzione Managed Accounts non è attiva di default per tutti i nuovi utenti. Hai due strade:

#### A. Attivazione tramite Portale (Se disponibile)

1. Accedi al [Mission Control Portal](https://portal.telnyx.com/).
2. Cerca nel menu a sinistra la voce **"Managed Accounts"**.
3. Se la vedi, puoi iniziare a creare sotto-account cliccando su **"Create Managed Account"**.

#### B. Attivazione tramite Supporto/Sales

Se la voce non appare, Telnyx richiede spesso una verifica manuale per abilitare questa funzione (specialmente per prevenire frodi).

* Invia un messaggio in chat o a `support@telnyx.com`.
* **Cosa scrivere:** *"I am building a SaaS platform for restaurants (Smartables) and I need to manage multiple customers with sub-accounts. Please enable the 'Managed Accounts' feature on my master account."*

---

### 4. Come gestire la creazione automatica (Antigravity Dashboard)

Una volta abilitato, non userai più il portale manuale, ma le API. Ecco il flusso logico per il tuo codice:

1. **Crea il Sotto-Account:**
* `POST /v2/managed_accounts`
* Questo crea l'ambiente isolato per il ristorante "X".


2. **Crea il Requirement Group nel Sotto-Account:**
* Invierai i documenti del ristoratore usando il token o l'intestazione specifica del Managed Account.


3. **Compra il Numero:**
* L'acquisto avverrà "dentro" il Managed Account.



---

### 5. Tempistiche di approvazione

Le tempistiche per i numeri acquistati tramite Managed Account seguono le stesse regole viste in precedenza:

* **Primo numero del cliente:** 24-48 ore (revisione manuale dei documenti caricati dal cliente).
* **Numeri successivi dello stesso cliente:** Quasi istantanei (se usano lo stesso Requirement Group già approvato).

**Attenzione:** Telnyx potrebbe richiedere che anche il tuo account "Padre" sia verificato (Livello 2) prima di permetterti di creare molti sotto-account.

---

**Vuoi che ti prepari una bozza della mail da inviare al supporto per sbloccare questa funzione immediatamente?**