# 💳 Proration (Upgrade/Downgrade Piano)

**Status:** Implementato
**Data implementazione:** 12/02/2026

---

## Stato Attuale

| Componente        | File                                                           | Cosa fa oggi                                                                                                                              |
| ----------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Piani**         | `lib/plans.ts`                                                 | 3 tier (Starter/Growth/Business), ognuno con `priceIdMonth` e `priceIdYear`                                                               |
| **Checkout**      | `utils/stripe/actions.ts` → `createStripeSubscriptionCheckout` | Crea una **nuova** sessione Stripe Checkout. Non gestisce upgrade                                                                         |
| **Billing Page**  | `app/(private)/(org)/billing/page.tsx`                         | Mostra piano attuale + lista piani disponibili tramite `PlansSwitcher`                                                                    |
| **PricingCard**   | `components/utility/pricing-card.tsx`                          | Il bottone fa **sempre** `<Link href="/register?plan=...">` → crea una nuova subscription, **non fa upgrade**                             |
| **Stripe Portal** | `createStripePortalSession`                                    | Reindirizza al portale Stripe. L'utente _potrebbe_ fare upgrade con regole default Stripe                                                 |
| **Webhook**       | `app/api/webhooks/stripe/route.ts`                             | Gestisce `customer.subscription.updated` sincronizzando `stripe_price_id`, `stripe_status`, e date. **Nessuna logica proration-specific** |

### Problemi

1. I bottoni dei piani nella billing page **non distinguono** tra "nuovo utente" e "utente con abbonamento attivo" — portano tutti a `/register`
2. **Non esiste** una server action `upgradeSubscription()` che usi `stripe.subscriptions.update()` con `proration_behavior`
3. Il webhook **non gestisce le invoice di proration** (Stripe le genera come `invoice.payment_succeeded` con line items parziali)

---

## Piano di Implementazione

### 1. Nuova Server Action: `changeSubscription(newPriceId: string)`

In `utils/stripe/actions.ts`, creare una funzione che:

1. Recupera l'`organization` con `stripe_subscription_id` attivo
2. Chiama:
   ```ts
   stripe.subscriptions.update(subscriptionId, {
     items: [{ id: existingItemId, price: newPriceId }],
     proration_behavior: "create_prorations",
   });
   ```
3. Stripe calcola automaticamente il credito residuo del piano vecchio e addebita la differenza

> **`proration_behavior` options:**
>
> - `'create_prorations'` → addebita/accredita subito la differenza (consigliato per upgrade)
> - `'always_invoice'` → genera una nuova invoice immediatamente
> - `'none'` → nessun prorate, il nuovo prezzo parte dal prossimo ciclo

### 2. Modificare la UI nella Billing Page

Nel `PricingCard` quando `context === 'private'`:

- Se l'utente **ha un abbonamento attivo**, il bottone deve chiamare `changeSubscription(newPriceId)` anziché andare a `/register`
- Mostrare quale piano è quello attuale (es. badge "Piano Attivo") e disabilitare il bottone
- Per i piani inferiori → label "Downgrade", per quelli superiori → label "Upgrade"
- Opzionale: preview del costo prorated con `stripe.invoices.createPreview()`

### 3. Aggiornare il Webhook

Il webhook `customer.subscription.updated` **già sincronizza** `stripe_price_id` e limiti. Per completezza aggiungere:

- Log specifico per tracciare i cambi piano
- Registrare una transaction in `transactions` per il prorate
- Eventuale reset dei contatori (es. `whatsapp_usage_count`) in caso di upgrade

### 4. Database

**Nessuna modifica necessaria.** La tabella `organizations` ha già `stripe_subscription_id`, `stripe_price_id`, `stripe_status`, `stripe_current_period_end`. La tabella `transactions` gestirà le invoice di proration come qualsiasi altra invoice.

---

## Scenari da Gestire

| Scenario                                          | Comportamento suggerito                               |
| ------------------------------------------------- | ----------------------------------------------------- |
| **Starter → Growth** (upgrade, stesso intervallo) | Prorate immediato, addebito della differenza          |
| **Monthly → Annual** (stessa tier)                | Prorate, credito del mese rimanente, addebito annuale |
| **Growth → Starter** (downgrade)                  | Applicare a fine periodo oppure prorate con credito   |
| **Utente con `cancel_at_period_end: true`**       | Decidere se riattivare prima di permettere upgrade    |

---

## File Coinvolti

| File                                             | Modifiche                                       |
| ------------------------------------------------ | ----------------------------------------------- |
| `utils/stripe/actions.ts`                        | Aggiungere `changeSubscription()`               |
| `components/utility/pricing-card.tsx`            | Logica condizionale per upgrade vs new checkout |
| `app/(private)/(org)/billing/page.tsx`           | Passare `currentPriceId` a `PlansSwitcher`      |
| `app/(private)/(org)/billing/plans-switcher.tsx` | Passare `currentPriceId` a `PricingCard`        |
| `app/api/webhooks/stripe/route.ts`               | Logging e transaction tracking per proration    |
