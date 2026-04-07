# ADR-001 — Agency Model: singolo account WABA Meta

**Stato**: Accepted  
**Data**: 2026-01-10  
**Autore**: Team Smartables

---

## Contesto

Per inviare messaggi WhatsApp Business ai clienti dei ristoranti, esistono due modelli di integrazione con Meta:

**Tech Provider (Embedded Signup)**: ogni ristoratore crea il proprio WABA (WhatsApp Business Account) e Smartables ottiene accesso tramite OAuth. Ogni cliente possiede il proprio account Meta, i propri numeri, i propri template.

**Agency Model**: Smartables possiede un singolo WABA master. Tutti i numeri telefono dei ristoratori vengono aggiunti a questo account. I clienti non hanno un account Meta proprio — Smartables eroga il servizio con branding del ristorante su ogni numero.

---

## Decisione

Adottiamo il **Agency Model** con singolo WABA Smartables.

---

## Motivazioni

1. **Onboarding radicalmente più semplice**: il flusso Tech Provider richiede che il ristoratore abbia o crei un account Meta Business verificato, colleghi il numero, approvi le permission OAuth. Questo elimina il 70% dei potenziali clienti nella fase di onboarding. Con l'agency model, il ristoratore non tocca mai Meta.

2. **Controllo qualità end-to-end**: Smartables controlla quali template vengono inviati, con quale frequenza, su quali numeri. Questo è fondamentale per la sopravvivenza dell'account.

3. **Velocità di attivazione**: l'attivazione di un nuovo numero nel nostro WABA richiede ~10 minuti via API (acquisto Telnyx → add to WABA → verifica OTP vocale). Con Embedded Signup i tempi sono giorni.

4. **Margini migliori**: non dobbiamo costruire e mantenere un OAuth flow complesso.

---

## Conseguenze

**Positive:**
- Onboarding in 10 minuti end-to-end
- Controllo totale su template, qualità messaggi, anti-spam

**Negative / Rischi:**
- **Shared Fate**: se il WABA viene sospeso da Meta (per violazione policy di un singolo cliente), tutti i clienti perdono il servizio. Questo è il rischio principale del modello.
- **Mitigazioni attive**: review manuale documenti compliance, anti-spam 24h rigido (vedi ADR-004), solo template categoria UTILITY, block rate monitorato < 2%.
- I clienti non possono "portarsi via" il numero WhatsApp se lasciano Smartables (lock-in).
