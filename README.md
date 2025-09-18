# API Integration Squadd ↔ CUP Solidale

Sistema di integrazione API tra Squadd (GoHighLevel) and CUP Solidale per la gestione di prenotazioni mediche.

## 🚀 Quick Start

### 1. Configurazione

1. Configura le variabili d'ambiente nel file `.env`:
```bash
# CUP Solidale API Configuration
CUP_SOLIDALE_API_URL=https://sandboxapi.cupsolidale.it/api/v1
CUP_SOLIDALE_COMPANY_CODE=your_company_code_here
CUP_SOLIDALE_API_KEY=your_api_key_here

# GoHighLevel API Configuration
GHL_API_KEY=your_ghl_api_key_here
GHL_LOCATION_ID=your_ghl_location_id_here
```

2. **Ottieni credenziali API:**
   
   **CUP Solidale:**
   - Invia email a: `info@cupsolidale.it`
   - Oggetto: "Richiesta attivazione API CUP Solidale per integrazione"
   - Richiedi: Codice Azienda + API Key + accesso sandbox
   
   **GoHighLevel:**
   - Ottieni API Key dalla dashboard GHL
   - Recupera Location ID del tuo account

3. Installa le dipendenze:
```bash
npm install
```

### 2. Test API

#### Test Completo
```bash
npm test
```

#### Test Singoli
```bash
# Test GoHighLevel (API Squadd)
npm run test:ghl-users      # Utenti → Dottori
npm run test:ghl-events     # Eventi → Prenotazioni
npm run test:ghl-calendars  # Calendari → Sedi

# Test CUP Solidale
npm run test:cup-connection # Verifica connessione
npm run test:cup-sedi      # Gestione sedi
```

## 🔄 Mapping Dati

### GoHighLevel → CUP Solidale

| GoHighLevel | CUP Solidale | Note |
|------------|--------------|------|
| Users | Dottori | Serve codice fiscale |
| Calendars | Sedi | Serve geolocalizzazione |
| Events | Prenotazioni | Conversione timestamp |
| Event Types | Prestazioni | Mapping manuale |

**Ordine implementazione:** Calendari→Sedi → Users→Dottori → Events→Prenotazioni

## 📁 Struttura Progetto

```
├── API Squadd/              # Test GoHighLevel API
│   ├── test-ghl-users.js    # Utenti GHL → dottori
│   ├── test-ghl-events.js   # Eventi GHL → prenotazioni
│   └── test-ghl-calendars.js # Calendari GHL → sedi
├── API CUP Solidale/        # Test CUP Solidale API
│   ├── test-cup-connection.js # Test connessione
│   └── test-cup-sedi.js      # Test gestione sedi
├── tests/
│   └── run-all-tests.js     # Test runner completo
├── .env                     # Configurazione API keys
├── cup-solidale-api-guide.md # Documentazione API CUP Solidale
└── WARP.md                  # Guida per WARP development
```

## 🏥 Workflow CUP Solidale

1. **Sedi** - Creare uffici medici con geolocalizzazione
2. **Prestazioni** - Definire servizi medici disponibili  
3. **Dottori** - Aggiungere medici con prestazioni associate
4. **Agende** - Creare calendari disponibilità per dottori/sedi
5. **Prenotazioni** - Sincronizzare appuntamenti da GoHighLevel

## 🔧 Development

### Logging
Tutti i test implementano logging completo per debugging delle chiamate API.

### Error Handling
Gestione errori con codici HTTP standard e messaggi dettagliati.

### Rate Limiting
Rispetto dei rate limits per entrambe le API.

## 📋 TODO

- [ ] Implementare sync bidirezionale
- [ ] Gestione conflitti data
- [ ] Webhook handlers
- [ ] Dashboard monitoring
- [ ] Unit tests Jest

## 🆘 Support

**Credenziali mancanti:**
- **GoHighLevel**: Serve API Key + Location ID
- **CUP Solidale**: Serve Codice Azienda + API Key

**Per problemi con:**
- **GoHighLevel API**: Verifica API key e location ID
- **CUP Solidale API**: Contatta info@cupsolidale.it per attivazione
- **Geolocalizzazione**: Usa coordinate precise lat/lng
- **Codici fiscali**: Richiesti per tutti i dottori
