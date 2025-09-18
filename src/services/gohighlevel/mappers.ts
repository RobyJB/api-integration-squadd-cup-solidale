import { format } from 'date-fns';
import { GHLEventResponse } from './types';
import { IndisponibilitaRequest } from '../cupsolidale/types';
import { EntityMapping } from '../../models/database';
import { CupSolidaleMappers } from '../cupsolidale/mappers';

export class GoHighLevelMappers {
  /**
   * Maps GoHighLevel calendar event to CUP Solidale indisponibilità
   */
  static mapGHLEventToIndisponibilita(
    ghlEvent: GHLEventResponse,
    mapping: EntityMapping
  ): IndisponibilitaRequest {
    const startTime = new Date(ghlEvent.startTime);
    const endTime = new Date(ghlEvent.endTime);

    return {
      id_indisponibilita: CupSolidaleMappers.generateIndisponibilitaId(ghlEvent.id),
      id_dottore: mapping.cupId,
      id_sede: mapping.mappingData?.defaultSedeId || '',
      tipologia: 'indisponibile',
      data_inizio: format(startTime, 'yyyy-MM-dd'),
      ora_inizio: format(startTime, 'HH:mm'),
      data_fine: format(endTime, 'yyyy-MM-dd'),
      ora_fine: format(endTime, 'HH:mm')
    };
  }

  /**
   * Checks if a GoHighLevel event should create an indisponibilità in CUP Solidale
   */
  static shouldCreateIndisponibilita(ghlEvent: GHLEventResponse): boolean {
    // Only create indisponibilità for confirmed appointments
    if (ghlEvent.appointmentStatus !== 'confirmed') {
      return false;
    }

    // Don't create indisponibilità for events that were synced from CUP Solidale
    if (ghlEvent.notes?.includes('Sincronizzato da CUP Solidale')) {
      return false;
    }

    // Don't create indisponibilità for events with specific tags/titles
    const excludePatterns = [
      /break/i,
      /lunch/i,
      /personal/i,
      /meeting/i,
      /admin/i
    ];

    return !excludePatterns.some(pattern => pattern.test(ghlEvent.title));
  }

  /**
   * Validates GoHighLevel event data
   */
  static validateGHLEvent(ghlEvent: GHLEventResponse): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!ghlEvent.id) {
      errors.push('Event ID is required');
    }

    if (!ghlEvent.title?.trim()) {
      errors.push('Event title is required');
    }

    if (!ghlEvent.startTime) {
      errors.push('Start time is required');
    }

    if (!ghlEvent.endTime) {
      errors.push('End time is required');
    }

    if (ghlEvent.startTime && ghlEvent.endTime) {
      const startTime = new Date(ghlEvent.startTime);
      const endTime = new Date(ghlEvent.endTime);

      if (isNaN(startTime.getTime())) {
        errors.push('Invalid start time format');
      }

      if (isNaN(endTime.getTime())) {
        errors.push('Invalid end time format');
      }

      if (startTime >= endTime) {
        errors.push('End time must be after start time');
      }
    }

    if (!ghlEvent.calendarId) {
      errors.push('Calendar ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Extracts calendar information from GoHighLevel event
   */
  static extractCalendarInfo(ghlEvent: GHLEventResponse): {
    calendarId: string;
    duration: number; // in minutes
    isAllDay: boolean;
    isRecurring: boolean;
  } {
    const startTime = new Date(ghlEvent.startTime);
    const endTime = new Date(ghlEvent.endTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Check if it's an all-day event (24 hours or more)
    const isAllDay = duration >= 1440; // 24 hours in minutes

    // Basic check for recurring events (this would need to be enhanced based on GHL API)
    const isRecurring = ghlEvent.title?.toLowerCase().includes('recurring') || false;

    return {
      calendarId: ghlEvent.calendarId,
      duration,
      isAllDay,
      isRecurring
    };
  }

  /**
   * Determines if an event overlaps with business hours
   */
  static isWithinBusinessHours(
    ghlEvent: GHLEventResponse,
    businessHours: {
      start: string; // "HH:MM"
      end: string;   // "HH:MM"
      days: number[]; // 0-6, Sunday-Saturday
    }
  ): boolean {
    const startTime = new Date(ghlEvent.startTime);
    const endTime = new Date(ghlEvent.endTime);

    // Check if event day is within business days
    const eventDay = startTime.getDay();
    if (!businessHours.days.includes(eventDay)) {
      return false;
    }

    // Check if event time overlaps with business hours
    const eventStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const eventEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    const businessStartMinutes = CupSolidaleMappers.timeToMinutes(businessHours.start);
    const businessEndMinutes = CupSolidaleMappers.timeToMinutes(businessHours.end);

    return eventStartMinutes < businessEndMinutes && eventEndMinutes > businessStartMinutes;
  }

  /**
   * Extracts participant information from GoHighLevel event
   */
  static extractParticipantInfo(ghlEvent: GHLEventResponse): {
    contactId?: string;
    assignedUserId?: string;
    hasContact: boolean;
    hasAssignedUser: boolean;
  } {
    return {
      contactId: ghlEvent.contactId,
      assignedUserId: ghlEvent.assignedUserId,
      hasContact: Boolean(ghlEvent.contactId),
      hasAssignedUser: Boolean(ghlEvent.assignedUserId)
    };
  }

  /**
   * Generates a summary for logging/debugging
   */
  static generateEventSummary(ghlEvent: GHLEventResponse): string {
    const startTime = new Date(ghlEvent.startTime);
    const endTime = new Date(ghlEvent.endTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    const summary = [];
    summary.push(`Event: ${ghlEvent.title}`);
    summary.push(`ID: ${ghlEvent.id}`);
    summary.push(`Calendar: ${ghlEvent.calendarId}`);
    summary.push(`Start: ${format(startTime, 'yyyy-MM-dd HH:mm')}`);
    summary.push(`End: ${format(endTime, 'yyyy-MM-dd HH:mm')}`);
    summary.push(`Duration: ${duration} minutes`);
    summary.push(`Status: ${ghlEvent.appointmentStatus}`);

    if (ghlEvent.contactId) {
      summary.push(`Contact: ${ghlEvent.contactId}`);
    }

    if (ghlEvent.assignedUserId) {
      summary.push(`Assigned to: ${ghlEvent.assignedUserId}`);
    }

    return summary.join(' | ');
  }

  /**
   * Checks if two events conflict (overlap in time)
   */
  static eventsConflict(event1: GHLEventResponse, event2: GHLEventResponse): boolean {
    const start1 = new Date(event1.startTime);
    const end1 = new Date(event1.endTime);
    const start2 = new Date(event2.startTime);
    const end2 = new Date(event2.endTime);

    return start1 < end2 && start2 < end1;
  }

  /**
   * Normalizes event status for consistent handling
   */
  static normalizeEventStatus(status: string): {
    normalized: string;
    shouldSync: boolean;
    shouldBlock: boolean;
  } {
    const statusLower = status.toLowerCase();

    switch (statusLower) {
      case 'confirmed':
        return {
          normalized: 'confirmed',
          shouldSync: true,
          shouldBlock: true
        };

      case 'cancelled':
      case 'canceled':
        return {
          normalized: 'cancelled',
          shouldSync: false,
          shouldBlock: false
        };

      case 'showed':
        return {
          normalized: 'completed',
          shouldSync: true,
          shouldBlock: false // Don't block past appointments
        };

      case 'noshow':
        return {
          normalized: 'no_show',
          shouldSync: true,
          shouldBlock: false // Don't block past appointments
        };

      case 'invalid':
        return {
          normalized: 'invalid',
          shouldSync: false,
          shouldBlock: false
        };

      default:
        return {
          normalized: 'unknown',
          shouldSync: false,
          shouldBlock: false
        };
    }
  }

  /**
   * Splits long events into multiple CUP Solidale indisponibilità blocks
   */
  static splitLongEvent(
    ghlEvent: GHLEventResponse,
    mapping: EntityMapping,
    maxHoursPerBlock: number = 8
  ): IndisponibilitaRequest[] {
    const startTime = new Date(ghlEvent.startTime);
    const endTime = new Date(ghlEvent.endTime);
    const duration = endTime.getTime() - startTime.getTime();
    const maxBlockDuration = maxHoursPerBlock * 60 * 60 * 1000; // Convert to milliseconds

    if (duration <= maxBlockDuration) {
      // Event is short enough, return single block
      return [this.mapGHLEventToIndisponibilita(ghlEvent, mapping)];
    }

    // Split into multiple blocks
    const blocks: IndisponibilitaRequest[] = [];
    let currentStart = new Date(startTime);

    while (currentStart < endTime) {
      const currentEnd = new Date(Math.min(
        currentStart.getTime() + maxBlockDuration,
        endTime.getTime()
      ));

      blocks.push({
        id_indisponibilita: `${CupSolidaleMappers.generateIndisponibilitaId(ghlEvent.id)}_${blocks.length + 1}`,
        id_dottore: mapping.cupId,
        id_sede: mapping.mappingData?.defaultSedeId || '',
        tipologia: 'indisponibile',
        data_inizio: format(currentStart, 'yyyy-MM-dd'),
        ora_inizio: format(currentStart, 'HH:mm'),
        data_fine: format(currentEnd, 'yyyy-MM-dd'),
        ora_fine: format(currentEnd, 'HH:mm')
      });

      currentStart = new Date(currentEnd);
    }

    return blocks;
  }

  /**
   * Filters events that are relevant for CUP Solidale sync
   */
  static filterRelevantEvents(events: GHLEventResponse[]): GHLEventResponse[] {
    return events.filter(event => {
      // Filter out past events (older than 1 day)
      const eventStart = new Date(event.startTime);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      if (eventStart < oneDayAgo) {
        return false;
      }

      // Filter out very short events (less than 15 minutes)
      const eventEnd = new Date(event.endTime);
      const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);

      if (duration < 15) {
        return false;
      }

      return this.shouldCreateIndisponibilita(event);
    });
  }
}