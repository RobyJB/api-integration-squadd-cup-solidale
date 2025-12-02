/**
 * CUP Solidale → GoHighLevel Sync Service
 *
 * Gestisce:
 * - prenotazione.created  → Cerca/crea contatto + crea evento
 * - prenotazione.updated  → Cerca contatto + aggiorna evento
 * - prenotazione.cancelled → Cancella evento
 * - contatto.created      → Cerca/crea solo contatto
 * - contatto.updated      → Cerca e aggiorna contatto (o crea se non esiste)
 */

import { config } from '../../config/env';
import { logger } from '../../utils/logger';

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

// ============================================
// TYPES
// ============================================

export type WebhookEventType =
  | 'prenotazione.created'
  | 'prenotazione.updated'
  | 'prenotazione.cancelled'
  | 'contatto.created'
  | 'contatto.updated';

export interface WebhookPayload {
  event_type: WebhookEventType;
  timestamp: string;
  data: PrenotazioneData | ContattoData | CancellazioneData;
}

export interface PrenotazioneData {
  id_prenotazione: string;
  data_prestazione: string;
  durata_minuti?: number;
  prestazione: {
    id_prestazione: string;
    nome: string;
    categoria?: string;
  };
  sede: {
    id_sede: string;
    nome: string;
  };
  dottore: {
    id_dottore: string;
    nome: string;
    specializzazione?: string;
  };
  paziente: PazienteData;
  pagamento?: {
    euro_totale: string;
    metodo: string;
    stato: string;
  };
  note_prenotazione?: string;
}

export interface ContattoData {
  paziente: PazienteData;
}

export interface CancellazioneData {
  id_prenotazione: string;
  motivo_cancellazione?: string;
}

export interface PazienteData {
  nome: string;
  cognome: string;
  email?: string;
  telefono?: string;
  codice_fiscale?: string;
  data_nascita?: string;
  sesso?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  note?: string;
  // Per update
  nuovo_email?: string;
  nuovo_telefono?: string;
}

export interface GHLContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface SyncResult {
  success: boolean;
  event_type: WebhookEventType;
  contactId?: string;
  eventId?: string;
  error?: string;
  contactCreated?: boolean;
  contactUpdated?: boolean;
  eventCreated?: boolean;
  eventUpdated?: boolean;
  eventDeleted?: boolean;
}

export interface MappingConfig {
  calendars: Record<string, string>;  // id_prestazione/id_sede → calendarId GHL
  dottori: Record<string, string>;    // id_dottore CUP → userId GHL
}

// ============================================
// SYNC SERVICE
// ============================================

export class CupToGhlSyncService {
  private apiKey: string;
  private locationId: string;
  private mapping: MappingConfig;

  // Storage per tracciare mapping prenotazione → eventId
  private prenotazioneToEvent: Map<string, string> = new Map();

  constructor(mapping: MappingConfig) {
    this.apiKey = config.ghl.apiToken;
    this.locationId = config.ghl.locationId;
    this.mapping = mapping;
  }

  /**
   * Gestisce il webhook in base all'event_type
   */
  async handleWebhook(payload: WebhookPayload): Promise<SyncResult> {
    logger.info('Webhook ricevuto', { event_type: payload.event_type, timestamp: payload.timestamp });

    switch (payload.event_type) {
      case 'prenotazione.created':
        return this.handlePrenotazioneCreated(payload.data as PrenotazioneData);

      case 'prenotazione.updated':
        return this.handlePrenotazioneUpdated(payload.data as PrenotazioneData);

      case 'prenotazione.cancelled':
        return this.handlePrenotazioneCancelled(payload.data as CancellazioneData);

      case 'contatto.created':
        return this.handleContattoCreated(payload.data as ContattoData);

      case 'contatto.updated':
        return this.handleContattoUpdated(payload.data as ContattoData);

      default:
        return {
          success: false,
          event_type: payload.event_type,
          error: `Event type non supportato: ${payload.event_type}`
        };
    }
  }

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * prenotazione.created → Cerca/crea contatto + crea evento
   */
  private async handlePrenotazioneCreated(data: PrenotazioneData): Promise<SyncResult> {
    try {
      // 1. Risolvi mapping calendario e dottore
      const calendarId = this.resolveCalendarId(data);
      const assignedUserId = this.resolveDottoreId(data.dottore.id_dottore);

      if (!calendarId) {
        throw new Error(`Calendario non mappato per prestazione: ${data.prestazione.id_prestazione}`);
      }
      if (!assignedUserId) {
        throw new Error(`Dottore non mappato: ${data.dottore.id_dottore}`);
      }

      // 2. Cerca o crea contatto
      const { contactId, created: contactCreated } = await this.findOrCreateContact(data.paziente);

      // 3. Crea evento
      const eventId = await this.createAppointment({
        calendarId,
        contactId,
        assignedUserId,
        data
      });

      // 4. Salva mapping prenotazione → event
      this.prenotazioneToEvent.set(data.id_prenotazione, eventId);

      return {
        success: true,
        event_type: 'prenotazione.created',
        contactId,
        eventId,
        contactCreated,
        eventCreated: true
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('handlePrenotazioneCreated failed', { error: errorMessage, id: data.id_prenotazione });

      return {
        success: false,
        event_type: 'prenotazione.created',
        error: errorMessage
      };
    }
  }

  /**
   * prenotazione.updated → Cerca contatto + aggiorna evento
   */
  private async handlePrenotazioneUpdated(data: PrenotazioneData): Promise<SyncResult> {
    try {
      // 1. Trova eventId esistente
      const eventId = this.prenotazioneToEvent.get(data.id_prenotazione);
      if (!eventId) {
        // Se non abbiamo l'evento, creiamolo come nuovo
        logger.warn('Evento non trovato per update, creo nuovo', { id: data.id_prenotazione });
        return this.handlePrenotazioneCreated(data);
      }

      // 2. Risolvi mapping
      const calendarId = this.resolveCalendarId(data);
      const assignedUserId = this.resolveDottoreId(data.dottore.id_dottore);

      // 3. Cerca contatto (dovrebbe esistere)
      const { contactId } = await this.findOrCreateContact(data.paziente);

      // 4. Aggiorna evento
      await this.updateAppointment(eventId, {
        calendarId,
        contactId,
        assignedUserId,
        data
      });

      return {
        success: true,
        event_type: 'prenotazione.updated',
        contactId,
        eventId,
        eventUpdated: true
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('handlePrenotazioneUpdated failed', { error: errorMessage, id: data.id_prenotazione });

      return {
        success: false,
        event_type: 'prenotazione.updated',
        error: errorMessage
      };
    }
  }

  /**
   * prenotazione.cancelled → Cancella evento
   */
  private async handlePrenotazioneCancelled(data: CancellazioneData): Promise<SyncResult> {
    try {
      const eventId = this.prenotazioneToEvent.get(data.id_prenotazione);
      if (!eventId) {
        logger.warn('Evento non trovato per cancellazione', { id: data.id_prenotazione });
        return {
          success: true,
          event_type: 'prenotazione.cancelled',
          eventDeleted: false
        };
      }

      await this.deleteAppointment(eventId);
      this.prenotazioneToEvent.delete(data.id_prenotazione);

      return {
        success: true,
        event_type: 'prenotazione.cancelled',
        eventId,
        eventDeleted: true
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('handlePrenotazioneCancelled failed', { error: errorMessage, id: data.id_prenotazione });

      return {
        success: false,
        event_type: 'prenotazione.cancelled',
        error: errorMessage
      };
    }
  }

  /**
   * contatto.created → Cerca/crea solo contatto
   */
  private async handleContattoCreated(data: ContattoData): Promise<SyncResult> {
    try {
      const { contactId, created } = await this.findOrCreateContact(data.paziente);

      return {
        success: true,
        event_type: 'contatto.created',
        contactId,
        contactCreated: created
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('handleContattoCreated failed', { error: errorMessage });

      return {
        success: false,
        event_type: 'contatto.created',
        error: errorMessage
      };
    }
  }

  /**
   * contatto.updated → Cerca e aggiorna contatto (o crea se non esiste)
   */
  private async handleContattoUpdated(data: ContattoData): Promise<SyncResult> {
    try {
      // Cerca contatto esistente
      let contact = await this.searchContactByEmail(data.paziente.email);
      if (!contact && data.paziente.telefono) {
        contact = await this.searchContactByPhone(data.paziente.telefono);
      }
      if (!contact && data.paziente.codice_fiscale) {
        contact = await this.searchContactByCodiceFiscale(data.paziente.codice_fiscale);
      }

      if (contact) {
        // Aggiorna contatto esistente
        await this.updateContact(contact.id, data.paziente);
        return {
          success: true,
          event_type: 'contatto.updated',
          contactId: contact.id,
          contactUpdated: true
        };
      } else {
        // Crea nuovo contatto
        const newContact = await this.createContact(data.paziente);
        return {
          success: true,
          event_type: 'contatto.updated',
          contactId: newContact.id,
          contactCreated: true
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('handleContattoUpdated failed', { error: errorMessage });

      return {
        success: false,
        event_type: 'contatto.updated',
        error: errorMessage
      };
    }
  }

  // ============================================
  // CONTACT METHODS
  // ============================================

  async findOrCreateContact(paziente: PazienteData): Promise<{ contactId: string; created: boolean }> {
    // Cerca per email
    if (paziente.email) {
      const found = await this.searchContactByEmail(paziente.email);
      if (found) {
        logger.info('Contatto trovato per email', { contactId: found.id });
        return { contactId: found.id, created: false };
      }
    }

    // Cerca per telefono
    if (paziente.telefono) {
      const found = await this.searchContactByPhone(paziente.telefono);
      if (found) {
        logger.info('Contatto trovato per telefono', { contactId: found.id });
        return { contactId: found.id, created: false };
      }
    }

    // Cerca per codice fiscale
    if (paziente.codice_fiscale) {
      const found = await this.searchContactByCodiceFiscale(paziente.codice_fiscale);
      if (found) {
        logger.info('Contatto trovato per codice fiscale', { contactId: found.id });
        return { contactId: found.id, created: false };
      }
    }

    // Crea nuovo
    const newContact = await this.createContact(paziente);
    logger.info('Nuovo contatto creato', { contactId: newContact.id });
    return { contactId: newContact.id, created: true };
  }

  async searchContactByEmail(email?: string): Promise<GHLContact | null> {
    if (!email) return null;

    const response = await fetch(`${GHL_BASE_URL}/contacts/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        locationId: this.locationId,
        page: 1,
        pageLimit: 1,
        filters: [{ field: 'email', operator: 'eq', value: email }]
      })
    });

    if (!response.ok) {
      throw new Error(`Search by email failed: ${response.status}`);
    }

    const data = await response.json() as { contacts?: GHLContact[] };
    return data.contacts?.[0] || null;
  }

  async searchContactByPhone(phone?: string): Promise<GHLContact | null> {
    if (!phone) return null;

    const response = await fetch(`${GHL_BASE_URL}/contacts/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        locationId: this.locationId,
        page: 1,
        pageLimit: 1,
        filters: [{ field: 'phone', operator: 'eq', value: phone }]
      })
    });

    if (!response.ok) {
      throw new Error(`Search by phone failed: ${response.status}`);
    }

    const data = await response.json() as { contacts?: GHLContact[] };
    return data.contacts?.[0] || null;
  }

  async searchContactByCodiceFiscale(codiceFiscale: string): Promise<GHLContact | null> {
    // Cerca nel custom field codice_fiscale
    const response = await fetch(`${GHL_BASE_URL}/contacts/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        locationId: this.locationId,
        page: 1,
        pageLimit: 1,
        filters: [{ field: 'codice_fiscale', operator: 'eq', value: codiceFiscale }]
      })
    });

    if (!response.ok) {
      // Se il campo non esiste, ignora l'errore
      return null;
    }

    const data = await response.json() as { contacts?: GHLContact[] };
    return data.contacts?.[0] || null;
  }

  async createContact(paziente: PazienteData): Promise<GHLContact> {
    const response = await fetch(`${GHL_BASE_URL}/contacts/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        locationId: this.locationId,
        firstName: paziente.nome,
        lastName: paziente.cognome,
        email: paziente.email,
        phone: paziente.telefono,
        address1: paziente.indirizzo,
        city: paziente.citta,
        state: paziente.provincia,
        postalCode: paziente.cap,
        source: 'CUP Solidale',
        tags: ['cup-solidale'],
        customFields: [
          { key: 'codice_fiscale', value: paziente.codice_fiscale || '' },
          { key: 'data_nascita', value: paziente.data_nascita || '' },
          { key: 'note_paziente', value: paziente.note || '' }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(`Create contact failed: ${error.message || response.status}`);
    }

    const data = await response.json() as { contact: GHLContact };
    return data.contact;
  }

  async updateContact(contactId: string, paziente: PazienteData): Promise<void> {
    const updateData: Record<string, string> = {};

    if (paziente.nuovo_email) updateData['email'] = paziente.nuovo_email;
    else if (paziente.email) updateData['email'] = paziente.email;

    if (paziente.nuovo_telefono) updateData['phone'] = paziente.nuovo_telefono;
    else if (paziente.telefono) updateData['phone'] = paziente.telefono;

    if (paziente.nome) updateData['firstName'] = paziente.nome;
    if (paziente.cognome) updateData['lastName'] = paziente.cognome;
    if (paziente.indirizzo) updateData['address1'] = paziente.indirizzo;
    if (paziente.citta) updateData['city'] = paziente.citta;
    if (paziente.provincia) updateData['state'] = paziente.provincia;
    if (paziente.cap) updateData['postalCode'] = paziente.cap;

    const response = await fetch(`${GHL_BASE_URL}/contacts/${contactId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(`Update contact failed: ${error.message || response.status}`);
    }
  }

  // ============================================
  // APPOINTMENT METHODS
  // ============================================

  async createAppointment(params: {
    calendarId: string;
    contactId: string;
    assignedUserId: string;
    data: PrenotazioneData;
  }): Promise<string> {
    const { startTime, endTime } = this.parseDateTime(
      params.data.data_prestazione,
      params.data.durata_minuti
    );

    const response = await fetch(`${GHL_BASE_URL}/calendars/events/appointments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        calendarId: params.calendarId,
        locationId: this.locationId,
        contactId: params.contactId,
        assignedUserId: params.assignedUserId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        title: params.data.prestazione.nome,
        appointmentStatus: 'confirmed',
        ignoreFreeSlotValidation: true,
        notes: this.buildNotes(params.data)
      })
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(`Create appointment failed: ${error.message || response.status}`);
    }

    const data = await response.json() as { id: string };
    return data.id;
  }

  async updateAppointment(eventId: string, params: {
    calendarId?: string;
    contactId: string;
    assignedUserId?: string;
    data: PrenotazioneData;
  }): Promise<void> {
    const { startTime, endTime } = this.parseDateTime(
      params.data.data_prestazione,
      params.data.durata_minuti
    );

    const updateData: Record<string, string> = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      title: params.data.prestazione.nome,
      notes: this.buildNotes(params.data)
    };

    if (params.calendarId) updateData['calendarId'] = params.calendarId;
    if (params.assignedUserId) updateData['assignedUserId'] = params.assignedUserId;

    const response = await fetch(`${GHL_BASE_URL}/calendars/events/${eventId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(`Update appointment failed: ${error.message || response.status}`);
    }
  }

  async deleteAppointment(eventId: string): Promise<void> {
    const response = await fetch(`${GHL_BASE_URL}/calendars/events/${eventId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(`Delete appointment failed: ${error.message || response.status}`);
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private resolveCalendarId(data: PrenotazioneData): string | undefined {
    // Prima prova con id_prestazione
    if (this.mapping.calendars[data.prestazione.id_prestazione]) {
      return this.mapping.calendars[data.prestazione.id_prestazione];
    }
    // Poi prova con id_sede
    if (this.mapping.calendars[data.sede.id_sede]) {
      return this.mapping.calendars[data.sede.id_sede];
    }
    // Prova combinazione sede_prestazione
    const key = `${data.sede.id_sede}_${data.prestazione.categoria}`;
    return this.mapping.calendars[key];
  }

  private resolveDottoreId(idDottore: string): string | undefined {
    return this.mapping.dottori[idDottore];
  }

  private parseDateTime(dataPrestazione: string, durataMinuti?: number): { startTime: Date; endTime: Date } {
    const startTime = new Date(dataPrestazione);
    const durata = durataMinuti || 30;
    const endTime = new Date(startTime.getTime() + durata * 60 * 1000);
    return { startTime, endTime };
  }

  private buildNotes(data: PrenotazioneData): string {
    const lines = [
      `Prenotazione CUP: ${data.id_prenotazione}`,
      `Prestazione: ${data.prestazione.nome}`,
      `Sede: ${data.sede.nome}`,
      `Dottore: ${data.dottore.nome}`
    ];

    if (data.pagamento) {
      lines.push(`Pagamento: ${data.pagamento.euro_totale}€ (${data.pagamento.stato})`);
    }

    if (data.note_prenotazione) {
      lines.push(`Note: ${data.note_prenotazione}`);
    }

    return lines.join('\n');
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Version': GHL_VERSION,
      'Content-Type': 'application/json'
    };
  }

  // ============================================
  // MAPPING MANAGEMENT
  // ============================================

  updateMapping(mapping: MappingConfig): void {
    this.mapping = mapping;
  }

  getMapping(): MappingConfig {
    return this.mapping;
  }

  // Per persistenza prenotazione → event mapping
  setPrenotazioneEventMapping(id: string, eventId: string): void {
    this.prenotazioneToEvent.set(id, eventId);
  }

  getPrenotazioneEventMapping(id: string): string | undefined {
    return this.prenotazioneToEvent.get(id);
  }
}

export default CupToGhlSyncService;
