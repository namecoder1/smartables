# ADR-007 — Semantic roles sui bottoni dei template WhatsApp

**Stato**: Accepted  
**Data**: 2026-03-01  
**Autore**: Team Smartables

---

## Contesto

I template WhatsApp hanno bottoni `QUICK_REPLY` con un testo visualizzato ("Prenota ora") e un payload logico inviato al server quando il cliente clicca ("book"). 

Il problema: i ristoratori possono personalizzare il testo del bottone nel loro template custom (es. "Sì, voglio prenotare!" invece di "Prenota"). Se `handleButtonClick` in `messages.ts` usa il testo visualizzato come payload per determinare l'azione, il comportamento del bot si rompe quando il testo cambia.

Due approcci:
**Payload = testo bottone**: semplice da creare, ma fragile — il comportamento dipende dal testo esatto.  
**Semantic roles**: ogni bottone ha un `semantic_role` (es. `"book"`, `"supplier"`, `"callback"`) indipendente dal testo. Al momento dell'invio, `ROLE_TO_PAYLOAD` inietta il payload canonico.

---

## Decisione

I bottoni dei template custom usano **semantic roles**. Il testo visualizzato è decorativo; la logica dipende dal `semantic_role` → payload canonico.

---

## Motivazioni

1. **Localizzazione/personalizzazione libera**: il ristoratore può scrivere il testo che vuole senza rompere la logica del bot. "Voglio prenotare!", "Sì, un tavolo!", "Book a table" mappano tutti allo stesso `semantic_role: "book"`.

2. **`handleButtonClick` stabile**: il dispatcher logico in `messages.ts` controlla il payload (sempre canonico), non il testo visualizzato. Zero coupling tra UI e logica.

3. **Testabilità**: `ROLE_TO_PAYLOAD` è una mappa statica testabile. `handleButtonClick` può essere testato con payload fissi.

---

## Conseguenze

**Positive:**
- Testo bottone completamente personalizzabile
- Logica bot immutabile indipendentemente dal testo
- Un solo punto di definizione dei payload canonici (`ROLE_TO_PAYLOAD` in `lib/waba-templates.ts`)

**Negative:**
- Complessità aggiuntiva nel builder dei template (l'editor deve mostrare i semantic roles disponibili)
- Il payload iniettato al send-time (`buildSendTimeButton()` in `call.ts`) deve rimanere in sync con `handleButtonClick`

---

## Note implementative

- `ROLE_TO_PAYLOAD` in `lib/waba-templates.ts` è la source of truth dei payload canonici
- `buildSendTimeButton()` in `_handlers/call.ts` inietta il payload al momento dell'invio del template
- `handleButtonClick()` in `_handlers/messages.ts` smista la logica in base al payload ricevuto
