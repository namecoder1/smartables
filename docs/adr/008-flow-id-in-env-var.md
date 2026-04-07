# ADR-008 — WhatsApp Flow ID in variabile d'ambiente, non nel DB

**Stato**: Accepted  
**Data**: 2026-03-01  
**Autore**: Team Smartables

---

## Contesto

Il Flow di prenotazione WhatsApp ha un ID univoco assegnato da Meta (`WHATSAPP_BOOKING_FLOW_ID`). Questo ID deve essere incluso nel payload del bottone `FLOW` quando si invia un template al cliente.

Due opzioni:
**Salvare il Flow ID nel DB** (es. nella tabella `locations` o `organizations`): ogni sede potrebbe avere il suo Flow, configurabile dall'admin.  
**Tenere il Flow ID in una variabile d'ambiente**: unico per tutta la piattaforma, configurato una volta a livello infrastrutturale.

---

## Decisione

Il Flow ID è una **variabile d'ambiente** (`WHATSAPP_BOOKING_FLOW_ID`), non un campo DB.

---

## Motivazioni

1. **È un dettaglio infrastrutturale, non un dato cliente**: tutti i clienti Smartables usano lo stesso Flow di prenotazione. Non ha senso che ogni sede abbia un Flow diverso — il Flow è parte del prodotto, non della configurazione del ristorante.

2. **Semplicità schema DB**: evita una colonna in più in `locations` che nessun ristoratore mai legge o modifica.

3. **Deployment atomico**: quando pubblichiamo un nuovo Flow (es. aggiunta campo allergie), aggiorniamo l'env var in Vercel e tutti i clienti usano immediatamente il nuovo Flow senza migration DB.

4. **Sicurezza**: il Flow ID non è un segreto ma non ha senso esporlo ai client tramite query DB. In env var rimane server-side.

---

## Conseguenze

**Positive:**
- Schema DB più semplice
- Aggiornamento Flow = cambio env var + redeploy
- Un solo Flow condiviso = consistenza UX per tutti i clienti

**Negative:**
- Impossibile avere Flow personalizzati per sede (limitazione accettabile nella fase attuale)
- Se Meta cambia il Flow ID (es. dopo publish/unpublish), richiede un redeploy per aggiornare l'env var
- Il Flow ID non è visibile nell'admin panel — richiede accesso a Vercel per consultarlo

---

## Note implementative

Il Flow ID viene iniettato in `buildMetaButton()` (e nei template handler) solo al momento della costruzione del payload da inviare a Meta. Non viene mai salvato nel DB né esposto nelle API client-side.
