import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { config } from '../../config/env';
import { logger, SyncLogger } from '../../utils/logger';
import { CupSolidaleError } from '../../utils/errors';
import { withRetry, CircuitBreaker } from '../../utils/retry';

// Extend axios config to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: { startTime: number };
  }
}
import {
  CupSolidaleConfig,
  CupApiResponse,
  PrenotazioniRequest,
  PrenotazioneResponse,
  SedeResponse,
  DottoreResponse,
  PrestazioneResponse,
  AgendaResponse,
  BatchSedeRequest,
  BatchDottoreRequest,
  BatchPrestazioneRequest,
  BatchAgendaRequest,
  BatchDisponibilitaRequest,
  BatchRemoveDisponibilitaRequest,
  BatchIndisponibilitaRequest,
  ChangeDataRequest
} from './types';

export class CupSolidaleClient {
  private axios: AxiosInstance;
  private circuitBreaker: CircuitBreaker;

  constructor(cupConfig?: CupSolidaleConfig) {
    const clientConfig = cupConfig || {
      baseUrl: config.cup.baseUrl,
      auth: {
        username: config.cup.companyCode,
        password: config.cup.apiKey
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    this.axios = axios.create({
      baseURL: clientConfig.baseUrl,
      auth: clientConfig.auth,
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
          'cup-solidale',
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
          'cup-solidale',
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
          'cup-solidale',
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
          'cup-solidale',
          error.config?.method?.toUpperCase() || 'GET',
          error.config?.url || '',
          error,
          { duration }
        );

        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: any): CupSolidaleError {
    if (error.response) {
      const { status, data } = error.response;
      const cupError = data?.error;

      return new CupSolidaleError(
        cupError?.message || `HTTP ${status} error`,
        status,
        cupError?.code?.toString(),
        status >= 500 || status === 429, // Retryable for server errors and rate limits
        error
      );
    } else if (error.request) {
      return new CupSolidaleError(
        'Network error - no response received',
        undefined,
        undefined,
        true, // Network errors are retryable
        error
      );
    } else {
      return new CupSolidaleError(
        `Request setup error: ${error.message}`,
        undefined,
        undefined,
        false,
        error
      );
    }
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    return withRetry(
      () => this.circuitBreaker.execute(async () => {
        const response: AxiosResponse<CupApiResponse<T>> = await this.axios.request({
          method,
          url: endpoint,
          data
        });

        if (!response.data.success) {
          throw new CupSolidaleError(
            response.data.error?.message || 'API returned success: false',
            response.status,
            response.data.error?.code?.toString()
          );
        }

        return response.data.data as T;
      }, `CUP API ${method} ${endpoint}`),
      { maxRetries: config.sync.maxRetries },
      `CUP API ${method} ${endpoint}`
    );
  }

  // Prenotazioni methods
  async getPrenotazioni(params?: PrenotazioniRequest): Promise<PrenotazioneResponse[]> {
    const queryParams = new URLSearchParams();

    if (params?.status) queryParams.append('status', params.status);
    if (params?.time) queryParams.append('time', params.time.toString());
    if (params?.extended) queryParams.append('extended', params.extended);
    if (params?.pagination) queryParams.append('pagination', params.pagination);

    const endpoint = `/prenotazioni/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    // Fetch first page to check if pagination is needed
    const firstResponse: AxiosResponse<CupApiResponse<PrenotazioneResponse[]>> = await this.axios.get(endpoint);

    if (!firstResponse.data.success) {
      throw new CupSolidaleError(
        firstResponse.data.error?.message || 'Failed to fetch prenotazioni'
      );
    }

    let allPrenotazioni = firstResponse.data.data || [];

    // If there's pagination, fetch remaining pages concurrently
    if (firstResponse.data.paging?.next) {
      const pageUrls = await this.extractAllPageUrls(firstResponse.data.paging.next);

      if (pageUrls.length > 0) {
        const pagePromises = pageUrls.map(url =>
          this.axios.get<CupApiResponse<PrenotazioneResponse[]>>(url.replace(config.cup.baseUrl, ''))
        );

        const pageResponses = await Promise.all(pagePromises);

        for (const response of pageResponses) {
          if (response.data.success && response.data.data) {
            allPrenotazioni = allPrenotazioni.concat(response.data.data);
          }
        }
      }
    }

    return allPrenotazioni;
  }

  async changePrenotazioneDate(data: ChangeDataRequest): Promise<void> {
    await this.makeRequest('POST', '/prenotazioni/change_date', data);
  }

  // Sedi methods
  async getSedi(idSede?: string): Promise<SedeResponse[]> {
    const endpoint = idSede ? `/sedi/${idSede}` : '/sedi/';
    const result = await this.makeRequest<SedeResponse | SedeResponse[]>('GET', endpoint);
    return Array.isArray(result) ? result : [result];
  }

  async addSedi(request: BatchSedeRequest): Promise<string> {
    return this.makeRequest('POST', '/sedi/add', request);
  }

  async deleteSede(idSede: string): Promise<any> {
    return this.makeRequest('DELETE', `/sedi/${idSede}`);
  }

  // Dottori methods
  async getDottori(idDottore?: string): Promise<DottoreResponse[]> {
    const endpoint = idDottore ? `/dottori/${idDottore}` : '/dottori/';
    const result = await this.makeRequest<DottoreResponse | DottoreResponse[]>('GET', endpoint);
    return Array.isArray(result) ? result : [result];
  }

  async addDottori(request: BatchDottoreRequest): Promise<string> {
    return this.makeRequest('POST', '/dottori/add', request);
  }

  async deleteDottore(idDottore: string): Promise<any> {
    return this.makeRequest('DELETE', `/dottori/${idDottore}`);
  }

  async deleteDottoreService(idDottore: string, idPrestazione: string): Promise<any> {
    return this.makeRequest('DELETE', `/dottori/${idDottore}/prestazioni/${idPrestazione}`);
  }

  // Prestazioni methods
  async getPrestazioni(idPrestazione?: string): Promise<PrestazioneResponse[]> {
    const endpoint = idPrestazione ? `/prestazioni/${idPrestazione}` : '/prestazioni/';

    // If fetching single prestazione, no pagination needed
    if (idPrestazione) {
      const result = await this.makeRequest<PrestazioneResponse | PrestazioneResponse[]>('GET', endpoint);
      return Array.isArray(result) ? result : [result];
    }

    // Fetch first page to check if pagination is needed
    const firstResponse: AxiosResponse<CupApiResponse<PrestazioneResponse[]>> = await this.axios.get(endpoint);

    if (!firstResponse.data.success) {
      throw new CupSolidaleError(
        firstResponse.data.error?.message || 'Failed to fetch prestazioni'
      );
    }

    let allPrestazioni = firstResponse.data.data || [];

    // If there's pagination, fetch remaining pages concurrently
    if (firstResponse.data.paging?.next) {
      const pageUrls = await this.extractAllPageUrls(firstResponse.data.paging.next);

      if (pageUrls.length > 0) {
        const pagePromises = pageUrls.map(url =>
          this.axios.get<CupApiResponse<PrestazioneResponse[]>>(url.replace(config.cup.baseUrl, ''))
        );

        const pageResponses = await Promise.all(pagePromises);

        for (const response of pageResponses) {
          if (response.data.success && response.data.data) {
            allPrestazioni = allPrestazioni.concat(response.data.data);
          }
        }
      }
    }

    return allPrestazioni;
  }

  async addPrestazioni(request: BatchPrestazioneRequest): Promise<string> {
    return this.makeRequest('POST', '/prestazioni/add', request);
  }

  async deletePrestazione(idPrestazione: string): Promise<any> {
    return this.makeRequest('DELETE', `/prestazioni/${idPrestazione}`);
  }

  // Agende methods
  async getAgende(idAgenda?: string): Promise<AgendaResponse[]> {
    const endpoint = idAgenda ? `/agende/${idAgenda}` : '/agende/';
    const result = await this.makeRequest<AgendaResponse | AgendaResponse[]>('GET', endpoint);
    return Array.isArray(result) ? result : [result];
  }

  async addAgende(request: BatchAgendaRequest): Promise<string> {
    return this.makeRequest('POST', '/agende/add', request);
  }

  async deleteAgenda(idAgenda: string): Promise<any> {
    return this.makeRequest('DELETE', `/agende/${idAgenda}`);
  }

  async deleteAllAgende(): Promise<any> {
    return this.makeRequest('DELETE', '/agende/removeall');
  }

  // Disponibilità methods
  async addDisponibilita(request: BatchDisponibilitaRequest): Promise<string> {
    // Split into chunks if over limit
    const chunks = this.chunkArray(request.availabilities, 5000);
    const results: string[] = [];

    for (const chunk of chunks) {
      const chunkRequest = { ...request, availabilities: chunk };
      const result = await this.makeRequest<string>('POST', '/disponibilita/add', chunkRequest);
      results.push(result);
    }

    return results.join(', ');
  }

  async removeDisponibilitaDays(request: BatchRemoveDisponibilitaRequest): Promise<string> {
    // Split into chunks if over limit
    const chunks = this.chunkArray(request.availabilities, 2000);
    const results: string[] = [];

    for (const chunk of chunks) {
      const chunkRequest = { ...request, availabilities: chunk };
      const result = await this.makeRequest<string>('POST', '/disponibilita/remove_days', chunkRequest);
      results.push(result);
    }

    return results.join(', ');
  }

  // Indisponibilità methods
  async addIndisponibilita(request: BatchIndisponibilitaRequest): Promise<string> {
    // Split into chunks if over limit
    const chunks = this.chunkArray(request.blocks, 2000);
    const results: string[] = [];

    for (const chunk of chunks) {
      const chunkRequest = { ...request, blocks: chunk };
      const result = await this.makeRequest<string>('POST', '/indisponibilita/add', chunkRequest);
      results.push(result);
    }

    return results.join(', ');
  }

  async deleteIndisponibilita(idIndisponibilita: string): Promise<any> {
    return this.makeRequest('DELETE', `/indisponibilita/${idIndisponibilita}`);
  }

  // Utility methods
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async extractAllPageUrls(firstNextUrl: string): Promise<string[]> {
    const pageUrls: string[] = [];
    let currentUrl = firstNextUrl;

    // Extract pagination pattern to generate all page URLs
    // Assuming pagination follows pattern like: ?pagination=1, ?pagination=2, etc.
    const paginationMatch = currentUrl.match(/pagination=(\d+)/);

    if (paginationMatch) {
      const startPage = parseInt(paginationMatch[1]);

      // We'll fetch a few pages ahead to discover the total, but limit to prevent infinite loops
      // This is a conservative approach - in production you might want to make this configurable
      for (let page = startPage; page < startPage + 10; page++) {
        const nextPageUrl = currentUrl.replace(/pagination=\d+/, `pagination=${page}`);

        try {
          // Do a quick HEAD request to check if the page exists
          const headResponse = await this.axios.head(nextPageUrl.replace(config.cup.baseUrl, ''));
          if (headResponse.status === 200) {
            pageUrls.push(nextPageUrl);
          } else {
            break; // No more pages
          }
        } catch (error) {
          // If HEAD request fails, the page doesn't exist
          break;
        }
      }
    }

    return pageUrls;
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      await this.getSedi();
      return true;
    } catch (error) {
      logger.error('CUP Solidale health check failed:', error);
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