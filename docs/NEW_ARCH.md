Certamente. Ecco un riassunto strutturato in Markdown pronto da passare ad Antigravity (o da salvare come documentazione) per allinearlo sul cambio di architettura.

---

# 📄 Context Update: Smartables DB Architecture V2 (VoIP Compliance)

## 1. Obiettivo dell'Aggiornamento

Passaggio da un'architettura monolitica a una basata su **Telnyx Managed Accounts** per risolvere i vincoli regolatori italiani sui numeri geografici (es. divieto di attivare uno 02-Milano con documenti di Pesaro).

## 2. Core Logic Changes

* **Compliance Granulare:** Ogni `Location` è ora vincolata a un `Requirement Group` specifico per il suo prefisso telefonico.
* **Managed Accounts:** Ogni `Organization` avrà un suo `telnyx_managed_account_id` per isolare billing e compliance.
* **Performance:** Ottimizzazione lookup numeri per gestire alto traffico VoIP.
* **Billing Atomico:** Spostamento della logica di addebito crediti dal livello applicativo al livello Database (Stored Procedures).

## 3. Schema V2: Le Modifiche Principali

### A. Nuove Tabelle & Relazioni

* **`public.telnyx_regulatory_requirements` (NUOVA):**
* Gestisce lo stato di approvazione dei documenti per prefisso (`area_code`).
* Constraint `UNIQUE(organization_id, area_code)` per evitare duplicazioni.


* **`public.organizations` (MODIFICATA):**
* Aggiunto `telnyx_managed_account_id` (Text/Unique).


* **`public.locations` (MODIFICATA):**
* Aggiunto `regulatory_requirement_id` (FK).
* Aggiunto `telnyx_voice_app_id` (per routing webhook specifico).
* Aggiunto **Hash Index** su `telnyx_phone_number` per lookup O(1).



### B. Funzioni & Billing

* **`deduct_organization_credits`:** Nuova funzione PL/PGSQL per transazioni atomiche (Lock -> Check Balance -> Update -> Log Transaction).

## 4. Procedura di Aggiornamento

Per applicare le modifiche, eseguiremo due script in sequenza rigorosa:

1. **RESET SCRIPT V2:**
* Esegue un `DROP CASCADE` pulito di tutte le tabelle, inclusa la nuova `telnyx_regulatory_requirements` e le nuove function.
* Garantisce un ambiente *fresh* per evitare conflitti di Foreign Key.


2. **SCHEMA SCRIPT V2:**
* Ricrea l'intera struttura DB con le nuove colonne per la compliance e gli indici di performance.