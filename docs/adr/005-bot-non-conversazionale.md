# ADR-005 — Bot non prenota conversazionalmente: usa WhatsApp Flow

**Stato**: Accepted  
**Data**: 2026-02-01  
**Autore**: Team Smartables

---

## Contesto

Il bot WhatsApp deve consentire ai clienti di prenotare un tavolo. Due approcci:

**Approccio conversazionale (tool calls)**: il bot AI (GPT-4o) riceve i messaggi del cliente, estrae data/ora/persone dal linguaggio naturale, chiama tool `create_booking()`. Il cliente scrive "domani sera alle 20 per 4" e il bot prenota.

**WhatsApp Flow (form strutturato)**: il bot invia un messaggio con un bottone che apre un mini-form nativo WhatsApp (date picker, selector persone, zone). Il cliente compila il form con UI guidata, il flow restituisce un payload strutturato che viene processato server-side.

---

## Decisione

Il bot **non prenota conversazionalmente**. Le prenotazioni passano sempre attraverso **WhatsApp Flow** (form nativo).

---

## Motivazioni

1. **Affidabilità strutturale**: il Flow garantisce che data, ora, numero persone e zona siano sempre presenti e nel formato corretto. Un approccio conversazionale introduce ambiguità ("domani" = quale giorno? "sera" = che ora?), errori di parsing, e richiede gestione degli stati della conversazione.

2. **Zero ambiguità linguistica**: l'italiano ha dialetti, abbreviazioni, errori di battitura. Un form strutturato elimina il problema alla radice.

3. **UX più veloce**: il cliente completa 4 campi in un form nativo WhatsApp (10 secondi) invece di scambiare 3-4 messaggi con il bot.

4. **Meno token OpenAI**: il bot AI risponde a domande generali (menu, orari, allergeni) ma non gestisce lo stato della prenotazione — nessun tool call, nessun context window esteso.

5. **Testabilità**: il payload del Flow è deterministico e testabile. Il comportamento conversazionale dipende dal modello e non è riproducibile.

---

## Conseguenze

**Positive:**
- Zero errori di parsing date/ora/persone
- UX guidata e rapida
- Costo OpenAI ridotto
- Comportamento prevedibile

**Negative:**
- Non funziona su WhatsApp Web (i Flow non sono supportati su desktop) — il cliente deve usare l'app mobile
- Il Flow ID è un dettaglio infrastrutturale che deve essere mantenuto aggiornato (vedi ADR-008)
- Se Meta depreca o modifica i Flow, va adattato il form

---

## Note implementative

Il Flow viene triggerato da un bottone nel template missed call (`missed_call_open`, `missed_call_closed`) e anche dal bot AI quando rileva intenzione di prenotazione. Il payload del Flow viene ricevuto da `/api/webhooks/whatsapp-flow/route.ts` (encrypted) e l'evento di completamento da `/api/webhooks/whatsapp/_handlers/messages.ts` (handler `handleFlowCompletion`).
