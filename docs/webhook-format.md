# Formato Webhook CUP Solidale → GHL

## Endpoint

```
POST https://your-server.com/webhook/cup-solidale
```

## Autenticazione

Il webhook supporta due metodi di autenticazione:

### 1. HMAC Signature (raccomandato)

Headers richiesti:
```
X-CUP-Signature: sha256=<hex_digest>
X-CUP-Timestamp: <unix_timestamp_ms>
```

Il digest HMAC-SHA256 viene calcolato su:
```
payload = timestamp + "." + JSON.stringify(body)
signature = HMAC-SHA256(payload, WEBHOOK_SECRET)
```

Esempio in Node.js:
```javascript
const crypto = require('crypto');

function signWebhook(body, secret) {
  const timestamp = Date.now().toString();
  const payload = `${timestamp}.${JSON.stringify(body)}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return {
    'X-CUP-Signature': `sha256=${signature}`,
    'X-CUP-Timestamp': timestamp
  };
}
```

### 2. API Key (semplice)

Header richiesto:
```
X-CUP-API-Key: <webhook_secret>
```

---

## Eventi Supportati

### 1. prenotazione.created

Inviato quando viene creata una nuova prenotazione.

```json
{
  "event_type": "prenotazione.created",
  "timestamp": "2024-12-02T10:30:00.000Z",
  "data": {
    "id_prenotazione": "pren_12345",
    "data_prestazione": "2024-12-10T15:00:00.000Z",
    "durata_minuti": 30,
    "prestazione": {
      "id_prestazione": "prest_001",
      "nome": "Visita Cardiologica",
      "categoria": "cardiologia"
    },
    "sede": {
      "id_sede": "68d693fa30e36",
      "nome": "Studio Medico Palermo"
    },
    "dottore": {
      "id_dottore": "dott_001",
      "nome": "Dr. Mario Rossi",
      "specializzazione": "Cardiologia"
    },
    "paziente": {
      "nome": "Giuseppe",
      "cognome": "Verdi",
      "email": "giuseppe.verdi@email.com",
      "telefono": "+393331234567",
      "codice_fiscale": "VRDGPP80A01H501X",
      "data_nascita": "1980-01-01",
      "sesso": "M",
      "indirizzo": "Via Roma 123",
      "cap": "90100",
      "citta": "Palermo",
      "provincia": "PA"
    },
    "pagamento": {
      "euro_totale": "80.00",
      "metodo": "carta",
      "stato": "pagato"
    },
    "note_prenotazione": "Paziente richiede certificato"
  }
}
```

**Comportamento:**
1. Cerca contatto GHL per email → telefono → codice_fiscale
2. Se non trovato, crea nuovo contatto
3. Crea appuntamento nel calendario mappato

---

### 2. prenotazione.updated

Inviato quando viene modificata una prenotazione esistente.

```json
{
  "event_type": "prenotazione.updated",
  "timestamp": "2024-12-02T11:00:00.000Z",
  "data": {
    "id_prenotazione": "pren_12345",
    "data_prestazione": "2024-12-11T16:00:00.000Z",
    "durata_minuti": 45,
    "prestazione": {
      "id_prestazione": "prest_001",
      "nome": "Visita Cardiologica + ECG",
      "categoria": "cardiologia"
    },
    "sede": {
      "id_sede": "68d693fa30e36",
      "nome": "Studio Medico Palermo"
    },
    "dottore": {
      "id_dottore": "dott_001",
      "nome": "Dr. Mario Rossi"
    },
    "paziente": {
      "nome": "Giuseppe",
      "cognome": "Verdi",
      "email": "giuseppe.verdi@email.com",
      "telefono": "+393331234567"
    }
  }
}
```

**Comportamento:**
1. Trova l'evento GHL associato alla prenotazione
2. Se non trovato, crea nuovo (come prenotazione.created)
3. Aggiorna data/ora, durata, titolo, note

---

### 3. prenotazione.cancelled

Inviato quando viene cancellata una prenotazione.

```json
{
  "event_type": "prenotazione.cancelled",
  "timestamp": "2024-12-02T12:00:00.000Z",
  "data": {
    "id_prenotazione": "pren_12345",
    "motivo_cancellazione": "Richiesta paziente"
  }
}
```

**Comportamento:**
1. Trova l'evento GHL associato
2. Elimina l'evento
3. Il contatto NON viene eliminato

---

### 4. contatto.created

Inviato quando viene registrato un nuovo paziente (senza prenotazione).

```json
{
  "event_type": "contatto.created",
  "timestamp": "2024-12-02T09:00:00.000Z",
  "data": {
    "paziente": {
      "nome": "Maria",
      "cognome": "Bianchi",
      "email": "maria.bianchi@email.com",
      "telefono": "+393339876543",
      "codice_fiscale": "BNCMRA85B45H501Y",
      "data_nascita": "1985-02-05",
      "sesso": "F",
      "indirizzo": "Via Libertà 45",
      "cap": "90139",
      "citta": "Palermo",
      "provincia": "PA",
      "note": "Paziente allergica a penicillina"
    }
  }
}
```

**Comportamento:**
1. Cerca contatto esistente per email → telefono → codice_fiscale
2. Se trovato, restituisce l'ID esistente
3. Se non trovato, crea nuovo contatto

---

### 5. contatto.updated

Inviato quando vengono aggiornati i dati di un paziente.

```json
{
  "event_type": "contatto.updated",
  "timestamp": "2024-12-02T09:30:00.000Z",
  "data": {
    "paziente": {
      "nome": "Maria",
      "cognome": "Bianchi",
      "email": "maria.bianchi@email.com",
      "telefono": "+393339876543",
      "nuovo_email": "m.bianchi.new@email.com",
      "nuovo_telefono": "+393330001111",
      "indirizzo": "Via Nuova 100",
      "cap": "90140",
      "citta": "Palermo"
    }
  }
}
```

**Comportamento:**
1. Cerca contatto per email/telefono originale
2. Se trovato, aggiorna i campi (usa nuovo_email/nuovo_telefono se presenti)
3. Se NON trovato, crea nuovo contatto con i dati aggiornati

---

## Risposte

### Successo (200)

```json
{
  "success": true,
  "event_type": "prenotazione.created",
  "contactId": "abc123",
  "eventId": "evt456",
  "contactCreated": true,
  "eventCreated": true
}
```

### Errore Validazione (400)

```json
{
  "success": false,
  "error": "Invalid payload: missing event_type or data"
}
```

### Errore Autenticazione (401)

```json
{
  "error": "Invalid signature"
}
```

### Errore Business Logic (422)

```json
{
  "success": false,
  "event_type": "prenotazione.created",
  "error": "Calendario non mappato per prestazione: prest_xxx"
}
```

### Errore Server (500)

```json
{
  "success": false,
  "event_type": "prenotazione.created",
  "error": "Internal error message"
}
```

---

## Configurazione Mapping

Per far funzionare i webhook, è necessario configurare il mapping in `src/config/mapping.ts`:

```typescript
const calendarsMapping = {
  // id_prestazione CUP → calendarId GHL
  'prest_cardiologia': 'ghl_calendar_cardiologia',

  // id_sede CUP → calendarId GHL (fallback)
  '68d693fa30e36': '6IAGPIxMRTt2rho5DrGw',
};

const dottoriMapping = {
  // id_dottore CUP → userId GHL
  'dott_001': 'ghl_user_rossi',
  'default': '6kmg2YF4uhCW3ztW3BtW',
};
```

---

## Test Endpoint

Health check:
```bash
curl https://your-server.com/webhook/health
```

Visualizza mapping corrente:
```bash
curl https://your-server.com/webhook/mapping
```
