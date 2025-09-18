# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This project facilitates API integration between **Squadd** and **CUP Solidale** healthcare booking platform. The integration allows for:

- Managing medical offices/locations (sedi) with geolocation
- Managing medical services/procedures (prestazioni) 
- Managing doctors (dottori) and their associated services
- Managing schedules/calendars (agende) for availability
- Managing bookings/appointments (prenotazioni)
- Managing availability slots and unavailability periods

## Architecture

```
├── API CUP Solidale/     # CUP Solidale API integration code
├── API Squadd/           # Squadd API integration code  
├── cup-solidale-api-guide.md  # Complete CUP Solidale API documentation
└── README.md            # Project documentation
```

### CUP Solidale API Integration

The CUP Solidale API (v1.5) is a RESTful API that manages healthcare booking workflows:

**Base URLs:**
- Production: `https://api.cupsolidale.it/api/v1`
- Development/Sandbox: `https://sandboxapi.cupsolidale.it/api/v1`

**Authentication:** HTTP Basic Auth (username = company code, password = API key)

**Key Endpoints:**
- `/sedi/*` - Medical offices/locations management
- `/prestazioni/*` - Medical services management  
- `/dottori/*` - Doctors and their services
- `/agende/*` - Schedule/calendar management
- `/disponibilita/*` - Availability slots management
- `/prenotazioni/*` - Bookings/appointments
- `/indisponibilita/*` - Unavailability periods

**Data Flow Order:**
1. Create offices (sedi) with geolocation
2. Create medical services (prestazioni) 
3. Create doctors (dottori) with associated services
4. Create schedules (agende) for doctors at offices
5. Manage availability slots and bookings

## Development Guidelines

### Project Structure
- Keep API integration code separated by system in respective directories
- Follow existing Italian naming conventions for CUP Solidale entities (sedi, prestazioni, dottori, agende)
- Use consistent ID patterns: `id_sede`, `id_dottore`, `id_prestazione`, `id_agenda`

### API Integration Patterns

**Request Format:**
- All POST/DELETE requests require `Content-Type: application/json`
- Use UTF-8 encoding for all requests
- Batch operations support up to 1000-5000 items depending on endpoint

**Response Format:**
```json
{
  "success": true|false,
  "data": [...] | "message",
  "error": {
    "code": 400,
    "message": "error description"
  }
}
```

**Date/Time Formats:**
- Dates: `YYYY-MM-DD`  
- Times: `HH:MM`
- Days of week: `lun,mar,mer,gio,ven,sab,dom` (Italian abbreviations)

### Key Integration Considerations

1. **Data Dependencies:** Services must be created before doctors, doctors before schedules
2. **Geolocation Required:** All offices need valid latitude/longitude coordinates
3. **Service Matching:** CUP Solidale services need to be mapped to internal services
4. **Availability Management:** Slots are automatically removed when appointments are made
5. **Error Handling:** API returns standard HTTP codes with detailed JSON error messages

### Common Operations

**Testing API Connection:**
```bash
curl -X GET -H "Authorization: Basic [base64_credentials]" "https://sandboxapi.cupsolidale.it/api/v1/sedi/"
```

**Creating Batch Data:**
Most endpoints support batch operations with arrays in the request body using keys like `offices`, `services`, `doctors`, `calendar`, `availabilities`.

### Logging and Debugging

Since this integrates with external APIs and handles medical data transmission:
- Implement comprehensive logging for all API requests/responses
- Log authentication attempts and failures
- Track data synchronization status
- Monitor for rate limits and API availability

### Data Validation

CUP Solidale requires:
- Valid Italian fiscal codes (codice_fiscale) for doctors
- Proper coordinate validation for office locations  
- Service categories must be: `visita`, `laboratorio`, or `diagnostica`
- Time slots cannot overlap with existing bookings/unavailability

## Git Workflow

This is a new project with initial structure. Current state shows:
- Single initial commit establishing project structure
- Main branch as default
- Empty directories awaiting implementation code