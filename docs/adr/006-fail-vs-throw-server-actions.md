# ADR-006 — `fail()` nelle server actions, `throw` solo in webhook/trigger

**Stato**: Accepted  
**Data**: 2026-01-25  
**Autore**: Team Smartables

---

## Contesto

Next.js App Router ha due pattern di gestione errori per il codice server:

**`throw`**: propaga l'errore al boundary più vicino (error.tsx) o genera una 500 non gestita. Interrompe il rendering/esecuzione immediatamente.

**Valori di ritorno tipizzati (`fail()`)**: la funzione ritorna sempre, anche in caso di errore. Il chiamante controlla `result.success` e decide come procedere.

---

## Decisione

- **Server Actions** → usare `fail()` da `lib/action-response.ts`. Mai `throw`.
- **Webhook handlers e Trigger.dev jobs** → `throw` (con custom error classes da `lib/errors.ts`).

---

## Motivazioni

### Per le Server Actions

1. **Consistenza con `ActionResult<T>`**: tutte le actions ritornano `{ success: boolean, error?: string, data?: T }`. Il componente client può sempre fare `if (!result.success) showError(result.error)` senza try/catch.

2. **No unhandled rejections in RSC**: un `throw` in una server action non catturato produce una 500 che Next.js mostra come error boundary o pagina di errore generica — pessima UX per un errore di validazione.

3. **Debugging più chiaro**: `fail("Failed to create booking")` è esplicito. Un throw che risale lo stack è più difficile da tracciare.

### Per Webhook e Trigger.dev

1. **Retry semantics**: Trigger.dev interpreta un `throw` come "job fallito, riprova". Un `return` senza throw viene interpretato come successo — anche se il job non ha completato il suo scopo.

2. **Webhook handler**: un `throw` in un webhook handler produce una risposta 500, che causa il retry del provider (Stripe, Telnyx, Meta). Questo è il comportamento voluto per errori transitori (DB down, API externa irraggiungibile).

---

## Conseguenze

**Positive:**
- Pattern chiaro e prevedibile per ogni contesto
- No crash silenzioso in UI per errori attesi
- Retry corretto per job e webhook

**Negative:**
- Richiede disciplina: un dev che scrive `throw` in una server action rompe il pattern
- `assertEnv()` in `lib/env-check.ts` è l'unica eccezione alle server actions — lancia `throw` all'inizializzazione del modulo (intenzionale: è un errore di configurazione, non di runtime)
