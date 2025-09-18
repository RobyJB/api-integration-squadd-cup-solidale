import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../../config/env';
import { logger, SyncLogger } from '../../utils/logger';
import { GoHighLevelError } from '../../utils/errors';
import { withRetry, CircuitBreaker } from '../../utils/retry';
import {
  GoHighLevelConfig,
  GHLApiResponse,
  GHLCalendarEvent,
  GHLCreateEventRequest,
  GHLUpdateEventRequest,
  GHLEventResponse,
  GHLGetEventsRequest,
  GHLContact,
  GHLCreateContactRequest,
  GHLCalendar,
  GHLUser,
  GHLErrorResponse
} from './types';

export class GoHighLevelClient {
  private axios: AxiosInstance;
  private circuitBreaker: CircuitBreaker;

  constructor(ghlConfig?: GoHighLevelConfig) {
    const clientConfig = ghlConfig || {
      baseUrl: config.ghl.baseUrl,
      apiToken: config.ghl.apiToken,
      locationId: config.ghl.locationId,
      headers: {
        'Authorization': `Bearer ${config.ghl.apiToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    this.axios = axios.create({
      baseURL: clientConfig.baseUrl,
      headers: clientConfig.headers,
      timeout: 30000 // 30 seconds
    });

    this.circuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 minute timeout

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        config.metadata = { startTime };

        SyncLogger.logAPICall(
          'gohighlevel',
          config.method?.toUpperCase() || 'GET',
          config.url || '',
          0,
          0,
          { request: config.data }
        );

        return config;
      },
      (error) => {
        SyncLogger.logAPIError(
          'gohighlevel',
          'REQUEST',
          '',
          error
        );
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config.metadata?.startTime || 0);

        SyncLogger.logAPICall(
          'gohighlevel',
          response.config.method?.toUpperCase() || 'GET',
          response.config.url || '',
          response.status,
          duration,
          { response: response.data }
        );

        return response;
      },
      (error) => {
        const duration = Date.now() - (error.config?.metadata?.startTime || 0);

        SyncLogger.logAPIError(
          'gohighlevel',
          error.config?.method?.toUpperCase() || 'GET',
          error.config?.url || '',
          error,
          { duration }
        );

        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: any): GoHighLevelError {
    if (error.response) {
      const { status, data } = error.response;
      let message = `HTTP ${status} error`;

      if (data) {
        if (typeof data === 'string') {
          message = data;
        } else if (data.message) {
          message = data.message;
        } else if (data.error) {
          message = data.error;
        }
      }

      return new GoHighLevelError(
        message,
        status,
        status >= 500 || status === 429, // Retryable for server errors and rate limits
        error
      );
    } else if (error.request) {
      return new GoHighLevelError(
        'Network error - no response received',
        undefined,
        true, // Network errors are retryable
        error
      );
    } else {
      return new GoHighLevelError(
        `Request setup error: ${error.message}`,
        undefined,
        false,
        error
      );
    }
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    return withRetry(
      () => this.circuitBreaker.execute(async () => {
        const response: AxiosResponse<T> = await this.axios.request({
          method,
          url: endpoint,
          data
        });

        return response.data;
      }, `GHL API ${method} ${endpoint}`),
      { maxRetries: config.sync.maxRetries },
      `GHL API ${method} ${endpoint}`
    );
  }

  // Calendar Event Methods
  async createCalendarEvent(event: GHLCreateEventRequest): Promise<string> {
    const response = await this.makeRequest<GHLEventResponse>(
      'POST',
      '/calendars/events',
      event
    );

    return response.id;
  }

  async updateCalendarEvent(eventId: string, event: GHLUpdateEventRequest): Promise<void> {
    await this.makeRequest<GHLEventResponse>(
      'PUT',
      `/calendars/events/${eventId}`,
      event
    );
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    await this.makeRequest<void>(
      'DELETE',
      `/calendars/events/${eventId}`
    );
  }

  async getCalendarEvent(eventId: string): Promise<GHLEventResponse> {
    return this.makeRequest<GHLEventResponse>(
      'GET',
      `/calendars/events/${eventId}`
    );
  }

  async getCalendarEvents(params: GHLGetEventsRequest): Promise<GHLEventResponse[]> {
    const queryParams = new URLSearchParams();

    if (params.calendarId) queryParams.append('calendarId', params.calendarId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.contactId) queryParams.append('contactId', params.contactId);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const endpoint = `/calendars/events?locationId=${params.locationId}&${queryParams.toString()}`;

    const response = await this.makeRequest<{ events: GHLEventResponse[] }>(
      'GET',
      endpoint
    );

    return response.events || [];
  }

  // Contact Methods
  async createContact(contact: GHLCreateContactRequest): Promise<string> {
    const response = await this.makeRequest<GHLContact>(
      'POST',
      `/contacts?locationId=${config.ghl.locationId}`,
      contact
    );

    return response.id!;
  }

  async updateContact(contactId: string, contact: Partial<GHLCreateContactRequest>): Promise<void> {
    await this.makeRequest<GHLContact>(
      'PUT',
      `/contacts/${contactId}`,
      contact
    );
  }

  async getContact(contactId: string): Promise<GHLContact> {
    return this.makeRequest<GHLContact>(
      'GET',
      `/contacts/${contactId}`
    );
  }

  async searchContacts(query: {
    email?: string;
    phone?: string;
    limit?: number;
    offset?: number;
  }): Promise<GHLContact[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('locationId', config.ghl.locationId);

    if (query.email) queryParams.append('email', query.email);
    if (query.phone) queryParams.append('phone', query.phone);
    if (query.limit) queryParams.append('limit', query.limit.toString());
    if (query.offset) queryParams.append('offset', query.offset.toString());

    const endpoint = `/contacts/search?${queryParams.toString()}`;

    const response = await this.makeRequest<{ contacts: GHLContact[] }>(
      'GET',
      endpoint
    );

    return response.contacts || [];
  }

  // Calendar Methods
  async getCalendars(): Promise<GHLCalendar[]> {
    const response = await this.makeRequest<{ calendars: GHLCalendar[] }>(
      'GET',
      `/calendars?locationId=${config.ghl.locationId}`
    );

    return response.calendars || [];
  }

  async getCalendar(calendarId: string): Promise<GHLCalendar> {
    return this.makeRequest<GHLCalendar>(
      'GET',
      `/calendars/${calendarId}`
    );
  }

  // User Methods
  async getUsers(): Promise<GHLUser[]> {
    const response = await this.makeRequest<{ users: GHLUser[] }>(
      'GET',
      `/users?locationId=${config.ghl.locationId}`
    );

    return response.users || [];
  }

  async getUser(userId: string): Promise<GHLUser> {
    return this.makeRequest<GHLUser>(
      'GET',
      `/users/${userId}`
    );
  }

  // Location Methods
  async getLocation(): Promise<any> {
    return this.makeRequest<any>(
      'GET',
      `/locations/${config.ghl.locationId}`
    );
  }

  // Utility Methods
  async findContactByEmail(email: string): Promise<GHLContact | null> {
    try {
      const contacts = await this.searchContacts({ email, limit: 1 });
      return contacts.length > 0 ? contacts[0] : null;
    } catch (error) {
      logger.warn('Failed to find contact by email:', { email, error: (error as Error).message });
      return null;
    }
  }

  async findContactByPhone(phone: string): Promise<GHLContact | null> {
    try {
      const contacts = await this.searchContacts({ phone, limit: 1 });
      return contacts.length > 0 ? contacts[0] : null;
    } catch (error) {
      logger.warn('Failed to find contact by phone:', { phone, error: (error as Error).message });
      return null;
    }
  }

  async findOrCreateContact(contactData: GHLCreateContactRequest): Promise<string> {
    // Try to find existing contact first
    let existingContact: GHLContact | null = null;

    if (contactData.email) {
      existingContact = await this.findContactByEmail(contactData.email);
    }

    if (!existingContact && contactData.phone) {
      existingContact = await this.findContactByPhone(contactData.phone);
    }

    if (existingContact) {
      // Update existing contact if needed
      if (this.shouldUpdateContact(existingContact, contactData)) {
        await this.updateContact(existingContact.id!, contactData);
      }
      return existingContact.id!;
    }

    // Create new contact
    return this.createContact(contactData);
  }

  private shouldUpdateContact(existing: GHLContact, newData: GHLCreateContactRequest): boolean {
    // Check if any field has changed
    return (
      (newData.firstName && existing.firstName !== newData.firstName) ||
      (newData.lastName && existing.lastName !== newData.lastName) ||
      (newData.phone && existing.phone !== newData.phone) ||
      (newData.address1 && existing.address1 !== newData.address1)
    );
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      await this.getLocation();
      return true;
    } catch (error) {
      logger.error('GoHighLevel health check failed:', error);
      return false;
    }
  }

  // Circuit breaker status
  getCircuitBreakerState(): string {
    return this.circuitBreaker.getState();
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
}