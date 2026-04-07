# Runbook: Webhook Telnyx Non Arrivano

> **Trigger**: Le chiamate ai numeri dei ristoranti non generano messaggi WhatsApp automatici.  
> **Impatto**: **ALTO** — il flusso di recupero chiamate perse smette di funzionare per tutti o alcuni ristoranti.  
> **Chi gestisce**: Sviluppatore on-call

---

## 1. Sintomi

- I ristoratori segnalano che le chiamate perse non generano messaggi WhatsApp ai clienti
- La tabella `telnyx_webhook_logs` non ha nuovi record `call.initiated` nelle ultime ore
- GlitchTip non mostra errori (il webhook non arriva nemmeno)
- `npm run ngrok` in locale non riceve richieste durante una chiamata di test

---

## 2. Diagnosi

### Step 1 — Verificare lo stato di Telnyx
```
Telnyx Portal → Dashboard → Status (telnyx.com/status)
```

### Step 2 — Verificare la configurazione webhook
```
Telnyx Portal → Voice → Call Control Applications → seleziona app
→ Webhooks → Webhook URL

Deve puntare a: https://app.smartables.it/api/webhooks/telnyx
```

### Step 3 — Verificare la firma webhook
Il webhook usa Ed25519 (`lib/telnyx-verify.ts`). Se `TELNYX_WEBHOOK_PUBLIC_KEY` è cambiata o sbagliata, tutti i webhook vengono rifiutati con 400 senza loggare nulla di utile.

```bash
# Controllare GlitchTip per errori con service=telnyx nelle ultime 24h
# Oppure verificare i log Vercel:
# Vercel Dashboard → Deployments → Functions → /api/webhooks/telnyx
```

### Step 4 — Test manuale
```bash
# Con ngrok attivo localmente:
npm run ngrok
# Cambiare temporaneamente il webhook URL in Telnyx Portal al tunnel ngrok
# Fare una chiamata di test
# Verificare che il webhook arrivi e venga processato
```

---

## 3. Cause comuni e soluzioni

| Causa | Soluzione |
|-------|-----------|
| URL webhook sbagliato in Telnyx Portal | Aggiornare a `https://app.smartables.it/api/webhooks/telnyx` |
| `TELNYX_WEBHOOK_PUBLIC_KEY` errata | Copiare la chiave corretta da Telnyx Portal → Auth → Webhook Signing |
| Deploy fallito su Vercel | Verificare l'ultimo deployment e fare rollback se necessario |
| Timeout Vercel (> 10s) | Ottimizzare il handler o aumentare il timeout della funzione |
| Telnyx in manutenzione | Attendere — controllare telnyx.com/status |
| `assertEnv()` fallisce al cold start | Verificare che tutte le env var siano presenti su Vercel |

---

## 4. Verifica ripristino

```sql
-- Controllare che arrivino nuovi eventi dopo la fix
SELECT event_type, created_at, location_id
FROM telnyx_webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 5. Prevenzione

- Aggiungere un alert su GlitchTip se non arrivano eventi `call.initiated` per > 2h durante orario di apertura ristoranti (indicatore: 0 record in `telnyx_webhook_logs` nelle ultime 2h)
- Testare il webhook dopo ogni deploy che tocca `app/api/webhooks/telnyx/`
