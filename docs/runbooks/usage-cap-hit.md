# Runbook: Cliente Raggiunge il Limite WhatsApp

> **Trigger**: Un'organizzazione supera il proprio `usage_cap_whatsapp` mensile.  
> **Impatto**: **MEDIO** — il ristoratore interessato smette di inviare messaggi automatici WhatsApp. Gli altri clienti non sono impattati.  
> **Chi gestisce**: Support / Sviluppatore

---

## 1. Come funziona il cap

Ogni organizzazione ha:
- `whatsapp_usage_count`: contatore incrementato da `increment_whatsapp_usage()` (RPC Supabase)
- `usage_cap_whatsapp`: limite mensile (400 Starter / 1200 Growth / 3500 Business + addon)
- Reset mensile: avviene automaticamente su `invoice.payment_succeeded` (webhook Stripe → `stripe/route.ts`)

Il controllo avviene in `lib/limiter.ts` → `checkResourceAvailability()`.

---

## 2. Sintomi

- Il ristoratore segnala che i clienti non ricevono più messaggi dopo le chiamate perse
- GlitchTip mostra `UsageLimitError` dal service `whatsapp`
- In `organizations`: `whatsapp_usage_count >= usage_cap_whatsapp`

---

## 3. Diagnosi

```sql
-- Verificare lo stato del cap per un'organizzazione specifica
SELECT
  name,
  whatsapp_usage_count,
  usage_cap_whatsapp,
  current_billing_cycle_start,
  billing_tier
FROM organizations
WHERE id = '<organization_id>';
```

```sql
-- Verificare quando scade il periodo di fatturazione corrente
SELECT stripe_current_period_end
FROM organizations
WHERE id = '<organization_id>';
```

---

## 4. Opzioni di risposta

### Opzione A — Il cliente non vuole fare upgrade (attendere il reset)
- [ ] Comunicare al ristoratore la data di reset (fine periodo di fatturazione Stripe)
- [ ] Nessuna azione tecnica necessaria — il reset avviene automaticamente

### Opzione B — Il cliente vuole fare upgrade del piano
- [ ] Guidare il ristoratore alla pagina Billing nell'app (`/billing`)
- [ ] L'upgrade via Stripe aggiorna automaticamente `usage_cap_whatsapp` via webhook `customer.subscription.updated`

### Opzione C — Il cliente vuole un addon WA Contacts
- [ ] Guidare alla pagina Billing → Sezione Addon → "Contatti WhatsApp aggiuntivi"
- [ ] Dopo l'acquisto, `usage_cap_whatsapp` viene aggiornato via webhook Stripe

### Opzione D — Reset manuale di emergenza (solo se errore di conteggio)
```sql
-- ATTENZIONE: eseguire solo se si è certi che il contatore sia errato
UPDATE organizations
SET whatsapp_usage_count = 0
WHERE id = '<organization_id>';
```

---

## 5. Notifiche automatiche

Il sistema invia già notifiche in-app (push) quando un'org si avvicina al limite.  
Implementato in `lib/notifications.ts` → `checkWhatsAppLimitNotification()`.

Verificare che le notifiche stiano arrivando correttamente:
```sql
SELECT * FROM notifications
WHERE organization_id = '<organization_id>'
AND type LIKE '%usage%'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 6. Prevenzione

- Valutare di aggiungere un'email automatica (Resend) quando `usage_count > 80%` del cap — attualmente solo push in-app
- Aggiungere una dashboard admin per visualizzare le org vicine al limite
