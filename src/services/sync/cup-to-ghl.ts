/**
 * CUP Solidale → GoHighLevel Sync Service
 *
 * Flusso:
 * 1. Riceve prenotazione da CUP Solidale
 * 2. Cerca contatto in GHL per email/phone
 * 3. Se non esiste, crea nuovo contatto
 * 4. Crea evento nel calendario GHL
 */

import { config } from '../../config/env';
import { logger } from '../../utils/logger';

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

interface CupPrenotazione {
  id_prenotazione: string;
  data_prestazione: string;  // "2025-12-03 14:00"
  nome_prestazione: string;
  dottore: string;
  sede: string;
  dati_cliente: string;      // "Mario Rossi (mario@example.com) RSSMRA80A01H501Z"
  dati_paziente: string;
  euro_totale: string;
  metodo_pagamento: string;
}

interface GHLContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface SyncResult {
  success: boolean;
  contactId?: string;
  eventId?: string;
  error?: string;
  contactCreated?: boolean;
}

export class CupToGhlSyncService {
  private apiKey: string;
  private locationId: string;

  constructor() {
    this.apiKey = config.ghl.apiToken;
    this.locationId = config.ghl.locationId;
  }

  /**
   * Sincronizza una prenotazione CUP Solidale verso GHL
   */
  async syncPrenotazione(
    prenotazione: CupPrenotazione,
    calendarId: string,
    assignedUserId: string
  ): Promise<SyncResult> {
    try {
      // 1. Estrai dati contatto dalla prenotazione
      const contactData = this.parseContactData(prenotazione.dati_cliente, prenotazione.dati_paziente);

      logger.info('Sync prenotazione', {
        id: prenotazione.id_prenotazione,
        email: contactData.email,
        phone: contactData.phone
      });

      // 2. Cerca o crea contatto
      const { contactId, created } = await this.findOrCreateContact(contactData);

      // 3. Crea evento nel calendario
      const eventId = await this.createAppointment({
        calendarId,
        contactId,
        assignedUserId,
        prenotazione
      });

      return {
        success: true,
        contactId,
        eventId,
        contactCreated: created
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Sync failed', { error: errorMessage, prenotazione: prenotazione.id_prenotazione });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Cerca contatto per email o phone. Se non esiste, lo crea.
   */
  async findOrCreateContact(contactData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  }): Promise<{ contactId: string; created: boolean }> {

    // Prima cerca per email
    if (contactData.email) {
      const found = await this.searchContactByEmail(contactData.email);
      if (found) {
        logger.info('Contatto trovato per email', { contactId: found.id, email: contactData.email });
        return { contactId: found.id, created: false };
      }
    }

    // Poi cerca per phone
    if (contactData.phone) {
      const found = await this.searchContactByPhone(contactData.phone);
      if (found) {
        logger.info('Contatto trovato per phone', { contactId: found.id, phone: contactData.phone });
        return { contactId: found.id, created: false };
      }
    }

    // Non trovato, crea nuovo contatto
    const newContact = await this.createContact(contactData);
    logger.info('Nuovo contatto creato', { contactId: newContact.id });

    return { contactId: newContact.id, created: true };
  }

  /**
   * Cerca contatto per email
   */
  async searchContactByEmail(email: string): Promise<GHLContact | null> {
    const response = await fetch(`${GHL_BASE_URL}/contacts/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        locationId: this.locationId,
        page: 1,
        pageLimit: 1,
        filters: [
          {
            field: 'email',
            operator: 'eq',
            value: email
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Search by email failed: ${response.status}`);
    }

    const data = await response.json();
    return data.contacts?.[0] || null;
  }

  /**
   * Cerca contatto per phone
   */
  async searchContactByPhone(phone: string): Promise<GHLContact | null> {
    const response = await fetch(`${GHL_BASE_URL}/contacts/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        locationId: this.locationId,
        page: 1,
        pageLimit: 1,
        filters: [
          {
            field: 'phone',
            operator: 'eq',
            value: phone
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Search by phone failed: ${response.status}`);
    }

    const data = await response.json();
    return data.contacts?.[0] || null;
  }

  /**
   * Crea nuovo contatto in GHL
   */
  async createContact(contactData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  }): Promise<GHLContact> {
    const response = await fetch(`${GHL_BASE_URL}/contacts/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        locationId: this.locationId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
        source: 'CUP Solidale',
        tags: ['cup-solidale']
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Create contact failed: ${error.message || response.status}`);
    }

    const data = await response.json();
    return data.contact;
  }

  /**
   * Crea appuntamento nel calendario GHL
   */
  async createAppointment(params: {
    calendarId: string;
    contactId: string;
    assignedUserId: string;
    prenotazione: CupPrenotazione;
  }): Promise<string> {
    const { startTime, endTime } = this.parseDateTime(params.prenotazione.data_prestazione);

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
        title: `${params.prenotazione.nome_prestazione}`,
        appointmentStatus: 'confirmed',
        ignoreFreeSlotValidation: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Create appointment failed: ${error.message || response.status}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Estrae dati contatto dal formato CUP Solidale
   * Formato: "Mario Rossi (mario@example.com) RSSMRA80A01H501Z"
   */
  private parseContactData(datiCliente: string, datiPaziente: string): {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  } {
    const data = datiCliente || datiPaziente;

    // Estrai nome (prima delle parentesi)
    const nameMatch = data.match(/^([^(]+)/);
    const fullName = nameMatch ? nameMatch[1].trim() : 'Sconosciuto';
    const nameParts = fullName.split(' ');

    // Estrai email (tra parentesi)
    const emailMatch = data.match(/\(([^@\s]+@[^)\s]+)\)/);

    // Estrai telefono (pattern italiano)
    const phoneMatch = data.match(/(\+39)?[\s]?([0-9]{3}[\s]?[0-9]{3,4}[\s]?[0-9]{3,4})/);

    return {
      firstName: nameParts[0] || 'Sconosciuto',
      lastName: nameParts.slice(1).join(' ') || '',
      email: emailMatch ? emailMatch[1] : undefined,
      phone: phoneMatch ? phoneMatch[0].replace(/\s/g, '') : undefined
    };
  }

  /**
   * Parse data prestazione CUP Solidale
   * Formato: "2025-12-03 14:00"
   */
  private parseDateTime(dataPrestazione: string): { startTime: Date; endTime: Date } {
    const startTime = new Date(dataPrestazione);
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // +30 minuti default

    return { startTime, endTime };
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Version': GHL_VERSION,
      'Content-Type': 'application/json'
    };
  }
}

export default CupToGhlSyncService;
