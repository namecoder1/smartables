# Runbook: Telnyx Rigetta i Documenti di Compliance

> **Trigger**: Telnyx rifiuta i documenti di identità/aziendali caricati per attivare un numero telefonico.  
> **Impatto**: **ALTO per il cliente specifico** — il numero non viene attivato, il flusso WhatsApp non parte.  
> **Chi gestisce**: Support + Sviluppatore (se problema tecnico)

---

## 1. Contesto

Per acquistare numeri italiani su Telnyx, la normativa AGCOM richiede la verifica dell'identità del titolare (documento + codice fiscale/P.IVA). Telnyx gestisce questo tramite "Regulatory Requirements" e "Requirement Groups".

Il flusso è:
```
Cliente carica documenti nell'app
→ Telnyx verifica (1-3 giorni lavorativi)
→ Webhook `requirement_group.status_updated` → `handleRequirementGroupStatusUpdated()`
→ Se approved: attivazione automatica numero + registrazione Meta WABA
→ Se rejected: email al ristoratore + `regulatory_status = "rejected"` nel DB
```

---

## 2. Sintomi

- Il ristoratore riceve email "Richiesta di conformità rifiutata" (`compliance-rejected` template)
- `locations.regulatory_status = "rejected"` per la sede
- `locations.regulatory_rejection_reason` contiene il motivo Telnyx
- GlitchTip non mostra errori (è un rifiuto legittimo, non un bug)

---

## 3. Diagnosi

```sql
-- Verificare stato e motivo del rifiuto
SELECT
  name,
  telnyx_phone_number,
  regulatory_status,
  regulatory_rejection_reason,
  telnyx_requirement_group_id
FROM locations
WHERE id = '<location_id>';
```

```
Telnyx Portal → Numbers → Regulatory Requirements
→ Filtrare per il requirement group ID → vedere i dettagli del rifiuto
```

---

## 4. Cause comuni e soluzioni

| Causa | Soluzione |
|-------|-----------|
| Documento scaduto | Chiedere al cliente di ricaricare documento valido |
| Documento illeggibile / bassa qualità | Chiedere scan ad alta risoluzione (min 300 DPI) |
| Nome sul documento non corrisponde alla ragione sociale | Caricare documento che corrisponda alla P.IVA registrata |
| P.IVA non corrispondente | Verificare che la P.IVA nell'app sia corretta |
| Tipo di documento non accettato | Telnyx richiede specifici tipi — verificare la lista accettata nel Portal |
| Errore di processing Telnyx | Ricaricare gli stessi documenti dopo 24h |

---

## 5. Procedura di re-submission

### Lato cliente (nell'app)
- [ ] Il ristoratore va su `Impostazioni → Connessioni → Numero Telefonico`
- [ ] Carica i documenti corretti
- [ ] Reinvia la richiesta

### Lato tecnico (se necessario)
```sql
-- Reset dello stato per permettere nuova submission
UPDATE locations
SET
  regulatory_status = 'pending',
  regulatory_rejection_reason = null
WHERE id = '<location_id>';
```

```
Telnyx Portal → Regulatory Requirements → seleziona requirement group
→ Edit → Upload new documents → Submit
```

---

## 6. Verifica attivazione dopo re-approval

Una volta approvato, il webhook `requirement_group.status_updated` con `status = "approved"` trigger automaticamente:
1. `activateLocation()` → aggiunge il numero al WABA Meta
2. `requestVerificationCode()` → Meta chiama il numero per l'OTP
3. `handleCallRecordingSaved()` → Whisper trascrive l'OTP
4. Il numero viene verificato e `activation_status = "verified"`

```sql
-- Verificare completamento attivazione
SELECT
  activation_status,
  meta_phone_id,
  regulatory_status
FROM locations
WHERE id = '<location_id>';
```

---

## 7. Escalation

Se il rifiuto è ingiustificato o ripetuto nonostante documenti corretti:
- Aprire ticket con Telnyx Support: support.telnyx.com
- Allegare il `telnyx_requirement_group_id` e i dettagli del rifiuto
