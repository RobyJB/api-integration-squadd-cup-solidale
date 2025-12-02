# CUP Solidale - Credenziali e Documentazione API

## Autenticazione

**Tipo:** HTTP Basic Auth

| Parametro | Valore (Sandbox) |
|-----------|------------------|
| Username | `umanis-palermo` |
| Password | `68d6900971147` |
| Base URL | `https://sandboxapi.cupsolidale.it/api/v1` |

### Header Authorization
```
Authorization: Basic base64("umanis-palermo:68d6900971147")
```
**Base64 encoded:** `dW1hbmlzLXBhbGVybW86NjhkNjkwMDk3MTE0Nw==`

### Esempio cURL
```bash
curl -X GET \
  -H "Authorization: Basic dW1hbmlzLXBhbGVybW86NjhkNjkwMDk3MTE0Nw==" \
  "https://sandboxapi.cupsolidale.it/api/v1/sedi/"
```

Per POST/DELETE aggiungere sempre:
```bash
-H "Content-Type: application/json"
```

---

## Ordine Obbligatorio delle Operazioni

**IMPORTANTE:** Seguire questa sequenza, altrimenti le API daranno errore.

| Step | Endpoint | Descrizione |
|------|----------|-------------|
| 1 | `POST /sedi/add` | Crea le sedi (già esistente: `68d693fa30e36`) |
| 2 | `POST /prestazioni/add` | Crea le prestazioni |
| 3 | **EMAIL a Cup Solidale** | Avvisarli per la mappatura manuale |
| 4 | `POST /dottori/add` | Crea i dottori con le prestazioni associate |
| 5 | `POST /agende/add` | Crea le agende (periodi disponibilità) |
| 6 | `POST /disponibilita/add` | Crea gli slot prenotabili effettivi |

---

## Endpoint Principali

### Sedi
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/sedi/` | Lista tutte le sedi |
| GET | `/sedi/{id_sede}` | Dettaglio sede |
| POST | `/sedi/add` | Crea/aggiorna sede |
| DELETE | `/sedi/{id_sede}` | Disattiva sede |

### Prestazioni
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/prestazioni/` | Lista prestazioni |
| POST | `/prestazioni/add` | Crea/aggiorna prestazioni |
| DELETE | `/prestazioni/{id}` | Disattiva prestazione |

### Dottori
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/dottori/` | Lista dottori |
| POST | `/dottori/add` | Crea/aggiorna dottore + prestazioni |
| DELETE | `/dottori/{id}` | Disattiva dottore |

### Agende
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/agende/` | Lista agende |
| POST | `/agende/add` | Crea/aggiorna agenda |
| DELETE | `/agende/{id}` | Elimina agenda |
| DELETE | `/agende/removeall` | Elimina TUTTE le agende |

### Slot (Disponibilità effettive)
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/disponibilita/add` | Crea slot prenotabili (max 5000) |
| POST | `/disponibilita/remove_days` | Rimuovi disponibilità per range date |

### Prenotazioni (da Cup Solidale)
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/prenotazioni/` | Lista prenotazioni ricevute |
| GET | `/prenotazioni/?status=completata&time=24` | Filtro ultimi 24h |
| GET | `/prenotazioni/?extended=true` | Con ID entità |
| POST | `/prenotazioni/change_date` | Modifica data prenotazione |

### Indisponibilità
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/indisponibilita/add` | Blocca periodi (ferie, chiusure) |
| DELETE | `/indisponibilita/{id}` | Rimuovi blocco |

---

## Note Importanti

- Sede già esistente: `68d693fa30e36`
- Ambiente: **Sandbox** (per produzione cambiare URL e credenziali)
