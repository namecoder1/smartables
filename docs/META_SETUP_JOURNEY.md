# 🧭 Smartables Meta & Telnyx Journey: The "Real World" Guide

Questo documento raccoglie tutto il sapere accumulato "sul campo" durante il setup di Smartables (Gennaio 2026), inclusi i workaround per bug di Meta e le specificità dei numeri italiani.

---

## 1. Strategia Iniziale: "Aggregator" vs "Tech Provider"

Per partire subito (MVP), abbiamo scelto il **Modello Ibrido**:

- **OGGI (Dev/Demo)**: Usiamo il tuo account Meta personale come "Aggregatore". I numeri vengono aggiunti al tuo WABA (WhatsApp Business Account).
- **DOMANI (Scale)**: Diventeremo "Meta Tech Provider" per isolare i clienti (Tech Provider require verifica business + app review).

---

## 2. Telnyx: Lezione sui Numeri Italiani

### Il problema del Fisso (Landline)

Hai acquistato un numero locale (es. `0721...` Pesaro).

- 🔴 **SMS**: Di default, molti archi di numerazione landline italiani su Telnyx **NON ricevono SMS**.
  - _Sintomo_: Meta invia il codice, ma su Telnyx (`Messaging` -> `Debug`) non arriva nulla. Errore: `Could not enable messaging on the number`.
- 🟢 **Soluzione**: Devi usare la verifica via **Chiamata Vocale**.

### Il trucco del "Call Forwarding"

Poiché non abbiamo ancora un centralino VoIP attivo per rispondere alla chiamata di Meta:

1.  Vai su Telnyx Portal -> **Numbers** -> **My Numbers**.
2.  Clicca sul numero -> Tab **Call Forwarding**.
3.  Attiva il forward verso il tuo cellulare personale (`+39...`).
4.  Quando Meta chiama, rispondi dal cellulare e segna il codice.

---

## 3. Meta Business: Trappole e Soluzioni

### Il Bug del "Developer Wizard"

- **Problema**: Nella dashboard `developers.facebook.com` -> `API Setup`, il wizard per aggiungere il numero spesso si blocca con errore: _"Il numero non è collegato a un account WhatsApp Business"_.
- **Soluzione**: Abbandona il portale Developer. Vai sul **WhatsApp Manager** "vero": [business.facebook.com/wa/manage](https://business.facebook.com/wa/manage). Aggiungi il numero da lì.

### Verifica dell'Azienda (Business Verification)

Meta ha stretto i controlli. Se il bottone "Aggiungi Numero" è sparito o disabilitato, devi prima verificare l'azienda.

#### Profilo "P.IVA Forfettaria"

Se sei un libero professionista / ditta individuale:

1.  Seleziona **"Impresa Individuale"** (Sole Proprietorship).
2.  **Nome Legale**: Deve essere IDENTICO al certificato P.IVA (es. _"Mario Rossi"_ o _"Agenzia Web di Mario Rossi"_). Non mettere _"Smartables"_ se non è legalmente registrato.
3.  **Documenti**: Carica la Visura Camerale o il Certificato di Attribuzione P.IVA.
4.  **Indirizzo**: Deve combaciare lettera per lettera con il documento caricato.

---

## 4. Checklist Operativa Aggiornata

1.  [x] Acquisto numero Telnyx (`+390721...`).
2.  [x] Attivazione Call Forwarding su Telnyx (verso cellulare).
3.  [ ] Avvio Business Verification su Meta (Security Center).
    - _Stato_: In attesa di upload documenti.
4.  [ ] Aggiunta numero su WhatsApp Manager (appena sbloccato dalla verifica).
    - Metodo: "Chiamata Vocale".
5.  [ ] Generazione Token "System User" (Admin) per le API.

---

## 5. FAQ "Panic Mode"

**Q: Meta non mi mostra l'opzione "Chiamata Vocale".**
A: Spesso appare solo dopo che hai fallito il primo SMS (aspetta 60 secondi). Se il numero è visto come "Cellulare" da Meta, potrebbe non mostrarlo mai. Soluzione: Cancella il numero e riaggiungilo dal WhatsApp Manager, facendo attenzione a selezionare il metodo PRIMA di inviare.

**Q: Ho cancellato il numero per sbaglio.**
A: Nessun problema. Finché è tuo su Telnyx, puoi riaggiungerlo. Attenzione ai limiti: se lo aggiungi/togli troppe volte in un'ora, Meta ti blocca per 24h.

**Q: Posso usare un numero mobile (`3...`) invece del fisso?**
A: Sì, su Telnyx costano circa $1/mese e ricevono SMS nativamente. È il piano B perfetto se il fisso dà troppe noie.
