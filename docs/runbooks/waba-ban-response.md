# Runbook: WABA Ban / Sospensione Meta

> **Trigger**: Meta sospende o limita il WhatsApp Business Account condiviso.  
> **Impatto**: **CRITICO** — nessun cliente Smartables riceve o invia messaggi WhatsApp.  
> **Chi gestisce**: Fondatore / CTO

---

## 1. Sintomi

- I webhook `/api/webhooks/whatsapp` smettono di arrivare (nessun evento in `telnyx_webhook_logs`)
- Le chiamate a `sendWhatsAppMessage()` restituiscono errore Meta (es. `190`, `368`, `131031`)
- GlitchTip mostra `captureError` dal service `whatsapp` in massa
- I clienti segnalano che i messaggi non arrivano

---

## 2. Diagnosi rapida

```bash
# Verificare lo stato del WABA nel Meta Business Manager
# Meta Business Manager → WhatsApp → Account Overview → Account Status

# Oppure via API Graph
curl -X GET "https://graph.facebook.com/v18.0/<WHATSAPP_BUSINESS_ACCOUNT_ID>?fields=account_review_status,ban_state&access_token=<META_SYSTEM_USER_TOKEN>"
```

**Codici errore Meta comuni:**
| Codice | Significato | Azione |
|--------|------------|--------|
| `131031` | Account temporarily banned | Attendere + contattare Meta Support |
| `368` | Account has been flagged | Contattare Meta Business Support |
| `190` | Token scaduto o revocato | Rigenerare `META_SYSTEM_USER_TOKEN` |
| `100` | Phone number not registered | Verificare `meta_phone_id` nel DB |

---

## 3. Procedura di risposta

### Fase 1 — Contenimento (entro 15 min)
- [ ] Confermare il ban via API Graph (vedi sopra)
- [ ] Aprire ticket su [Meta Business Support](https://www.facebook.com/business/help) con dettagli account
- [ ] Notificare i clienti attivi via email (Resend) che il servizio WhatsApp è temporaneamente sospeso
- [ ] Impostare una banner di manutenzione nell'app se il downtime sarà > 1h

### Fase 2 — Analisi causa (entro 1h)
- [ ] Verificare i log `telnyx_webhook_logs` per pattern anomali (es. volume alto da un singolo `location_id`)
- [ ] Verificare se un ristoratore ha aggirato la logica anti-spam (ADR-004)
- [ ] Controllare GlitchTip per errori `whatsapp` nelle 24h precedenti
- [ ] Identificare il `location_id` / `organization_id` potenzialmente responsabile

### Fase 3 — Ripristino
- [ ] Seguire le istruzioni di Meta Support per il ripristino dell'account
- [ ] Se necessario, rigenerare il System User Token e aggiornare `META_SYSTEM_USER_TOKEN` su Vercel
- [ ] Verificare il ripristino con un test manuale di invio messaggio
- [ ] Se un ristoratore ha causato il ban: sospendere temporaneamente il suo accesso al canale WhatsApp (impostare `whatsapp_enabled = false` nella sua sede)

### Fase 4 — Post-mortem
- [ ] Documentare la causa nel `CHANGELOG.md` nella sezione `Known Issues`
- [ ] Valutare se aggiungere limiti più restrittivi o alert preventivi

---

## 4. Contatti utili

- Meta Business Support: https://www.facebook.com/business/help
- Meta Status: https://developers.facebook.com/status
- Documentazione errori API: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes

---

## 5. Prevenzione

- Il limite anti-spam 24h (ADR-004) è il principale presidio — non renderlo configurabile
- Monitorare `whatsapp_usage_count` per org: alert se > 80% del cap mensile in < 15 giorni
- Verificare mensilmente che nessuna sede abbia template con tasso di block > 2%
