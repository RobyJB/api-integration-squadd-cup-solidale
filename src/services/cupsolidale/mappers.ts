import { createHash } from 'crypto';
import { PrenotazioneResponse } from './types';
import { GHLCreateEventRequest, GHLCreateContactRequest } from '../gohighlevel/types';
import { EntityMapping } from '../../models/database';

export class CupSolidaleMappers {
  /**
   * Maps CUP Solidale prenotazione to GoHighLevel calendar event
   */
  static mapPrenotazioneToGHLEvent(
    prenotazione: PrenotazioneResponse,
    mapping: EntityMapping
  ): GHLCreateEventRequest {
    const { startTime, endTime } = this.parseDataPrestazione(prenotazione.data_prestazione);
    const contactInfo = this.parseContactInfo(prenotazione.dati_cliente, prenotazione.dati_paziente);

    return {
      title: `${prenotazione.nome_prestazione} - ${contactInfo.name}`,
      calendarId: mapping.ghlCalendarId!,
      locationId: mapping.mappingData?.locationId || '',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      appointmentStatus: 'confirmed',
      notes: this.buildEventNotes(prenotazione),
      address: mapping.mappingData?.address || prenotazione.sede,
      toNotify: false // Don't send notifications for synced events
    };
  }

  /**
   * Maps CUP Solidale contact data to GoHighLevel contact
   */
  static mapContactDataToGHL(
    datiCliente: string,
    datiPaziente: string
  ): GHLCreateContactRequest {
    const clientInfo = this.parseContactInfo(datiCliente, datiPaziente);

    return {
      firstName: clientInfo.firstName,
      lastName: clientInfo.lastName,
      name: clientInfo.name,
      email: clientInfo.email,
      phone: clientInfo.phone,
      source: 'CUP Solidale Sync',
      tags: ['cup-solidale', 'prenotazione'],
      customFields: [
        {
          id: 'cup_codice_fiscale',
          value: clientInfo.codiceFiscale || ''
        }
      ]
    };
  }

  /**
   * Creates a checksum for prenotazione data to detect changes
   */
  static createPrenotazioneChecksum(prenotazione: PrenotazioneResponse): string {
    const dataForChecksum = {
      data_prestazione: prenotazione.data_prestazione,
      nome_prestazione: prenotazione.nome_prestazione,
      dottore: prenotazione.dottore,
      sede: prenotazione.sede,
      euro_totale: prenotazione.euro_totale,
      metodo_pagamento: prenotazione.metodo_pagamento
    };

    return createHash('md5')
      .update(JSON.stringify(dataForChecksum))
      .digest('hex');
  }

  /**
   * Parses the data_prestazione field to extract start and end times
   */
  private static parseDataPrestazione(dataPrestazione: string): {
    startTime: Date;
    endTime: Date;
  } {
    // Format: "2018-04-27 16:30"
    const startTime = new Date(dataPrestazione);

    // Assume 30 minutes duration if not specified
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

    return { startTime, endTime };
  }

  /**
   * Parses contact information from CUP Solidale format
   */
  private static parseContactInfo(datiCliente: string, datiPaziente: string): {
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    codiceFiscale?: string;
  } {
    // Format: "valentina marino (vm4579@gmail.com) MRNVNT98L50A717H"
    const clientData = datiCliente || datiPaziente;

    const nameMatch = clientData.match(/^([^(]+)/);
    const emailMatch = clientData.match(/\(([^@\s]+@[^)\s]+)\)/);
    const codiceFiscaleMatch = clientData.match(/([A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z])$/);

    const fullName = nameMatch ? nameMatch[1].trim() : 'Unknown';
    const nameParts = fullName.split(' ');

    return {
      name: fullName,
      firstName: nameParts[0] || undefined,
      lastName: nameParts.slice(1).join(' ') || undefined,
      email: emailMatch ? emailMatch[1] : undefined,
      codiceFiscale: codiceFiscaleMatch ? codiceFiscaleMatch[1] : undefined
    };
  }

  /**
   * Builds event notes with prenotazione details
   */
  private static buildEventNotes(prenotazione: PrenotazioneResponse): string {
    const notes = [];

    notes.push(`Prenotazione ID: ${prenotazione.id_prenotazione}`);
    notes.push(`Dottore: ${prenotazione.dottore}`);
    notes.push(`Sede: ${prenotazione.sede}`);
    notes.push(`Prestazione: ${prenotazione.nome_prestazione}`);
    notes.push(`Costo: €${prenotazione.euro_totale}`);
    notes.push(`Pagamento: ${prenotazione.metodo_pagamento}`);

    if (prenotazione.dati_cliente !== prenotazione.dati_paziente) {
      notes.push(`Cliente: ${prenotazione.dati_cliente}`);
      notes.push(`Paziente: ${prenotazione.dati_paziente}`);
    } else {
      notes.push(`Paziente: ${prenotazione.dati_paziente}`);
    }

    notes.push('');
    notes.push('Sincronizzato da CUP Solidale');

    return notes.join('\n');
  }

  /**
   * Maps Italian day names to GoHighLevel format
   */
  static mapItalianDaysToGHL(giorni: string[]): number[] {
    const dayMapping: Record<string, number> = {
      'dom': 0, // Sunday
      'lun': 1, // Monday
      'mar': 2, // Tuesday
      'mer': 3, // Wednesday
      'gio': 4, // Thursday
      'ven': 5, // Friday
      'sab': 6  // Saturday
    };

    return giorni
      .map(day => dayMapping[day.toLowerCase()])
      .filter(day => day !== undefined);
  }

  /**
   * Converts time from "HH:MM" format to minutes since midnight
   */
  static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Converts minutes since midnight to "HH:MM" format
   */
  static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Validates if a date string is in the correct CUP Solidale format (YYYY-MM-DD)
   */
  static isValidCupDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validates if a time string is in the correct CUP Solidale format (HH:MM)
   */
  static isValidCupTime(timeString: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeString);
  }

  /**
   * Generates a unique ID for indisponibilità based on GHL event
   */
  static generateIndisponibilitaId(ghlEventId: string): string {
    return `ghl_${ghlEventId}`;
  }

  /**
   * Extracts phone number from various Italian formats
   */
  static extractPhoneNumber(text: string): string | null {
    // Italian phone number patterns
    const phonePatterns = [
      /(\+39\s?)?([0-9]{3}\s?[0-9]{3,4}\s?[0-9]{3,4})/,  // +39 XXX XXX XXXX
      /(\+39)?([0-9]{10})/,                                // +39XXXXXXXXXX
      /([0-9]{3}\s?[0-9]{3,4}\s?[0-9]{3,4})/              // XXX XXX XXXX
    ];

    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) {
        let phone = match[0].replace(/\s/g, '');
        if (!phone.startsWith('+39')) {
          phone = '+39' + phone;
        }
        return phone;
      }
    }

    return null;
  }

  /**
   * Sanitizes text for GoHighLevel fields (removes special characters)
   */
  static sanitizeText(text: string): string {
    return text
      .replace(/[^\w\s\-.,!?()@]/g, '') // Remove special characters except common punctuation
      .trim();
  }

  /**
   * Formats Italian fiscal code validation
   */
  static isValidCodiceFiscale(codiceFiscale: string): boolean {
    const regex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;
    return regex.test(codiceFiscale);
  }
}