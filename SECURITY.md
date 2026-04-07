# Security Policy

## Segnalare una Vulnerabilità

**Non aprire una issue pubblica.** Le issue pubbliche sono visibili a tutti e potrebbero essere sfruttate prima che la vulnerabilità sia corretta.

Invia una email a **security@smartables.it** con:
- Descrizione della vulnerabilità
- Passi per riprodurla
- Impatto stimato (dati esposti, account compromessi, ecc.)
- Eventuale proposta di fix

### Tempistiche di risposta

| Fase | Entro |
|------|-------|
| Conferma ricezione | 48 ore |
| Valutazione severità | 5 giorni lavorativi |
| Patch per Critical/High | 7 giorni |
| Patch per Medium/Low | 30 giorni |

---

## Versioni Supportate

Solo la versione in produzione riceve patch di sicurezza. Non manteniamo branch LTS.

| Versione | Supportata |
|----------|------------|
| Produzione (main) | ✅ |
| Branch precedenti | ❌ |

---

## Scope

### In Scope
- **Autenticazione e autorizzazione** — bypass login, escalation privilegi, accesso cross-org
- **Webhook integrity** — injection di payload falsificati (Stripe, Meta, Telnyx)
- **PII exposure** — dati clienti (phone, nome, messaggi WhatsApp) accessibili senza autorizzazione
- **Billing** — manipolazione piani, bypass limiti di utilizzo
- **GDPR** — impossibilità di cancellare dati, retention eccessiva

### Out of Scope
- DoS / DDoS (rate limiting parziale già in atto)
- Social engineering verso il team
- Vulnerabilità in dipendenze terze già note e non ancora patchate upstream
- Report generati da scanner automatici senza dimostrazione di impatto reale

---

## Disclosure Policy

Pratichiamo **coordinated disclosure**:
1. Segnali la vulnerabilità in privato
2. Lavoriamo insieme per capire l'impatto e sviluppare la patch
3. Rilasciamo la patch
4. Puoi pubblicare i dettagli tecnici **30 giorni dopo il fix** (o prima, di comune accordo)

Ci impegniamo a non intraprendere azioni legali verso ricercatori che agiscono in buona fede e seguono questa policy.

---

## Crediti

I ricercatori che segnalano vulnerabilità valide vengono ringraziati pubblicamente nel CHANGELOG (se lo desiderano).
