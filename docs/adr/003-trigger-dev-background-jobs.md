# ADR-003 — Trigger.dev per background jobs (vs Vercel Cron / Edge Functions)

**Stato**: Accepted  
**Data**: 2026-01-15  
**Autore**: Team Smartables

---

## Contesto

Tre scenari richiedono esecuzione differita o lunga:
1. **Reminder prenotazione**: inviare un messaggio WhatsApp 24h prima dell'orario prenotato (può attendere ore/giorni)
2. **Richiesta recensione**: inviare un messaggio all'orario della prenotazione
3. **Sync Google Calendar**: aggiornare un evento GCal in seguito a modifica booking (< 5s, ma asincrono)

Opzioni valutate:
- **Vercel Cron**: esegue funzioni su schedule cron (ogni N minuti). Timeout 60s su piano Hobby, 300s su Pro.
- **Vercel Edge Functions / background tasks**: fire-and-forget ma senza stato, senza retry, senza observability.
- **Trigger.dev**: piattaforma dedicata a background jobs con retry nativo, `wait.until()` (attesa fino a data specifica), dashboard di monitoraggio, log per ogni run.

---

## Decisione

Utilizziamo **Trigger.dev v3** per tutti i background jobs.

---

## Motivazioni

1. **`wait.until(date)`**: la funzione di attesa fino a una data specifica è fondamentale per i reminder. Con Vercel Cron dovremmo fare polling ogni minuto su tutti i booking pending — inefficiente e costoso. Con Trigger.dev il job dorme fino al momento esatto.

2. **Retry nativo con backoff**: se il job fallisce (es. Meta API temporaneamente down), Trigger.dev riprova automaticamente con exponential backoff configurabile per job. Vercel non ha retry.

3. **Observability**: ogni run ha log, status, durata, input/output visibili nella dashboard. Debug immediato senza dover cercare nei log Vercel.

4. **Timeout illimitato**: i job Trigger.dev non hanno timeout di esecuzione. Fondamentale per `wait.until()` che può dormire giorni.

---

## Conseguenze

**Positive:**
- Zero polling sul DB per reminder
- Retry automatico su failure API esterne
- Dashboard di monitoring dedicata per ogni job
- Timeout illimitato

**Negative:**
- Dipendenza da servizio esterno (Trigger.dev cloud)
- Latenza aggiuntiva di ~500ms per il dispatch del task
- Costo aggiuntivo (piano Trigger.dev)
- I task non possono importare moduli Next.js che dipendono dal request context (es. `next/headers`)
