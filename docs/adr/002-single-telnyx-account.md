# ADR-002 — Singolo account Telnyx (no sub-account)

**Stato**: Accepted  
**Data**: 2026-01-10  
**Autore**: Team Smartables

---

## Contesto

Telnyx offre due modelli di gestione numeri:

**Sub-account (Managed Accounts)**: ogni cliente ha un sub-account Telnyx dedicato con billing separato, numeri isolati, reporting indipendente.

**Account singolo master**: tutti i numeri di tutti i clienti vivono sotto un unico account Telnyx. I webhook arrivano a un unico endpoint e vengono smistati per numero.

---

## Decisione

Utilizziamo un **singolo account Telnyx master** per tutti i clienti.

---

## Motivazioni

1. **Costo minimo**: Telnyx richiede un minimum spend mensile di ~$1.000 per accedere ai Managed Accounts. Non sostenibile nella fase beta con pochi clienti.

2. **Semplicità operativa**: un solo API key, un solo webhook endpoint, un solo pannello di monitoraggio. La complessità di gestire N account separati non porta valore al prodotto nella fase attuale.

3. **Provisioning via API**: l'acquisto numeri, la configurazione Connection ID, e il routing webhook sono completamente automatizzati. Il singolo account non introduce collo di bottiglia operativo.

---

## Conseguenze

**Positive:**
- Costo zero overhead su account management
- Unico punto di monitoraggio per tutti i numeri
- Provisioning automatico via API in < 5 minuti

**Negative / Rischi:**
- **Shared Fate su Telnyx**: se l'account viene sospeso (per problemi di compliance su un numero), tutti i clienti perdono la telefonia. Mitigazione: review documentale rigorosa prima di acquistare ogni numero (flusso admin compliance in `/manage`).
- Billing aggregato: non è possibile attribuire il costo preciso per cliente senza query analytics dedicata.
- Al superamento di una certa scala (> 500 numeri attivi), la migrazione a sub-account potrebbe diventare necessaria.
