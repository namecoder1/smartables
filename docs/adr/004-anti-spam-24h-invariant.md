# ADR-004 — Anti-spam 24h: invariante di sistema non configurabile

**Stato**: Accepted  
**Data**: 2026-01-20  
**Autore**: Team Smartables

---

## Contesto

Ogni chiamata persa a un numero Telnyx genera un messaggio WhatsApp automatico al chiamante. Senza limitazioni, uno stesso cliente potrebbe ricevere un messaggio ad ogni chiamata, ogni giorno — comportamento spam che Meta sanziona con sospensione dell'account.

La domanda è: questo limite dovrebbe essere **configurabile per sede** (es. "ogni 6 ore", "ogni 48 ore") o essere un **invariante fisso di sistema**?

---

## Decisione

Il rate limit anti-spam è **fisso a 24 ore** e **non è configurabile** dal ristoratore.

Implementazione: `call.ts` controlla se esiste un `whatsapp_message` per quel `customer_id` + `location_id` nelle ultime 24 ore. Se sì, hangup silenzioso senza messaggio.

---

## Motivazioni

1. **Shared Fate del WABA**: tutti i clienti Smartables condividono lo stesso WABA Meta. Un ristoratore che imposta "ogni 5 minuti" può generare abbastanza block/spam report da far sospendere l'account per tutti gli altri clienti. Il vincolo protegge l'intera piattaforma, non solo il singolo cliente.

2. **Semplicità UX**: non esporre opzioni che potrebbero danneggiare l'account. Il ristoratore non deve capire le policy Meta per usare il prodotto.

3. **Allineamento con le policy Meta**: Meta raccomanda esplicitamente di non inviare messaggi marketing/utility ripetuti allo stesso numero in breve tempo. 24h è il minimo ragionevole.

---

## Conseguenze

**Positive:**
- Protezione account WABA per tutti i clienti
- Nessuna configurazione da gestire o validare
- Comportamento prevedibile e testabile

**Negative:**
- I ristoratori non possono abbassare la soglia (es. per locali con alta rotazione clienti)
- Se un cliente chiama due volte in un giorno, la seconda chiamata non riceve risposta automatica — perdita potenziale di una prenotazione
- Richiede commento esplicito nel codice per evitare che un futuro dev "ottimizzi" questo controllo credendolo un bug

---

## Note implementative

Il check avviene in `app/api/webhooks/telnyx/_handlers/call.ts` prima di qualsiasi invio WhatsApp. Il dropped call viene loggato in `telnyx_webhook_logs` con `event_type: "call.dropped_rate_limited"` per visibilità nel dashboard admin.
