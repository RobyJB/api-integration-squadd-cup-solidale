/**
 * Configurazione mapping CUP Solidale → GoHighLevel
 *
 * Mappa gli ID delle entità CUP agli ID corrispondenti in GHL
 */

import { MappingConfig } from '../services/sync/cup-to-ghl';

/**
 * Mapping calendari:
 * - Chiave: id_prestazione CUP OPPURE id_sede CUP OPPURE combinazione "sede_categoria"
 * - Valore: calendarId GHL
 *
 * Il sistema cerca in ordine:
 * 1. id_prestazione
 * 2. id_sede
 * 3. sede_categoria (es: "68d693fa30e36_odontoiatria")
 */
const calendarsMapping: Record<string, string> = {
  // Esempio: prestazione specifica → calendario GHL
  // 'id_prestazione_cup': 'calendar_id_ghl',

  // Sede default (se non trova match più specifico)
  '68d693fa30e36': '6IAGPIxMRTt2rho5DrGw',  // Sede CUP → Calendario test GHL

  // Puoi aggiungere mapping per categoria
  // '68d693fa30e36_odontoiatria': 'calendar_id_odontoiatria',
  // '68d693fa30e36_cardiologia': 'calendar_id_cardiologia',
};

/**
 * Mapping dottori:
 * - Chiave: id_dottore CUP
 * - Valore: userId GHL (assignedUserId per gli appuntamenti)
 */
const dottoriMapping: Record<string, string> = {
  // Esempio: dottore CUP → user GHL
  // 'id_dottore_cup': 'user_id_ghl',

  // Dottore default per test
  'default': '6kmg2YF4uhCW3ztW3BtW',  // User test GHL
};

/**
 * Configurazione completa di mapping
 */
export const mappingConfig: MappingConfig = {
  calendars: calendarsMapping,
  dottori: dottoriMapping
};

/**
 * Helper per caricare mapping da file JSON o database
 * (per future estensioni)
 */
export function loadMappingFromEnv(): MappingConfig {
  // In futuro si potrebbe caricare da variabili d'ambiente o database
  // Per ora usa la configurazione statica
  return mappingConfig;
}

/**
 * Valida che tutti i mapping necessari siano presenti
 */
export function validateMapping(config: MappingConfig): boolean {
  const hasCalendars = Object.keys(config.calendars).length > 0;
  const hasDottori = Object.keys(config.dottori).length > 0;

  if (!hasCalendars) {
    console.warn('WARNING: Nessun mapping calendario configurato');
  }
  if (!hasDottori) {
    console.warn('WARNING: Nessun mapping dottore configurato');
  }

  return hasCalendars && hasDottori;
}
