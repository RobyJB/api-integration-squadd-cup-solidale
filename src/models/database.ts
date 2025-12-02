import { Client } from 'pg';
import { dbManager } from '../config/database';
import { logger } from '../utils/logger';

export interface EntityMapping {
  id: number;
  cupType: 'sede' | 'dottore' | 'prestazione';
  cupId: string;
  ghlCalendarId?: string;
  ghlUserId?: string;
  mappingData?: Record<string, any>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncLog {
  id: number;
  syncType: 'cup_to_ghl' | 'ghl_to_cup';
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'sync';
  status: 'success' | 'error' | 'pending' | 'retry';
  errorMessage?: string;
  retryCount: number;
  requestPayload?: Record<string, any>;
  responsePayload?: Record<string, any>;
  executionTimeMs?: number;
  processedAt: Date;
}

export interface PrenotazioneCache {
  cupPrenotazioneId: number;
  ghlEventId?: string;
  dataPrestzaione: Date;
  status: string;
  checksum?: string;
  syncData?: Record<string, any>;
  lastSync: Date;
  createdAt: Date;
}

export interface IndisponibilitaCache {
  ghlEventId: string;
  cupIndisponibilitaId?: string;
  cupDottoreId: string;
  cupSedeId: string;
  startTime: Date;
  endTime: Date;
  eventData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncConfig {
  id: number;
  configKey: string;
  configValue: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncQueueItem {
  id: string;
  queueType: 'prenotazione_sync' | 'indisponibilita_sync' | 'mapping_update';
  priority: number;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  scheduledFor: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

export interface WebhookEvent {
  id: string;
  source: 'gohighlevel' | 'cupsolidale';
  eventType: string;
  eventId?: string;
  payload: Record<string, any>;
  processed: boolean;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

export interface SystemStatus {
  id: number;
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export class DatabaseService {
  private client: Client | null = null;

  async getClient(): Promise<Client> {
    if (!this.client) {
      this.client = await dbManager.connectPostgres();
    }
    return this.client;
  }

  // Entity Mappings
  async createEntityMapping(mapping: Omit<EntityMapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<EntityMapping> {
    const client = await this.getClient();
    const query = `
      INSERT INTO entity_mappings (cup_type, cup_id, ghl_calendar_id, ghl_user_id, mapping_data, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await client.query(query, [
      mapping.cupType,
      mapping.cupId,
      mapping.ghlCalendarId,
      mapping.ghlUserId,
      mapping.mappingData ? JSON.stringify(mapping.mappingData) : null,
      mapping.active
    ]);

    return this.mapEntityMappingRow(result.rows[0]);
  }

  async getEntityMapping(cupType: string, cupId: string): Promise<EntityMapping | null> {
    const client = await this.getClient();
    const query = `
      SELECT * FROM entity_mappings
      WHERE cup_type = $1 AND cup_id = $2 AND active = true
    `;

    const result = await client.query(query, [cupType, cupId]);
    return result.rows.length > 0 ? this.mapEntityMappingRow(result.rows[0]) : null;
  }

  async getEntityMappingByGHLCalendar(ghlCalendarId: string): Promise<EntityMapping | null> {
    const client = await this.getClient();
    const query = `
      SELECT * FROM entity_mappings
      WHERE ghl_calendar_id = $1 AND active = true
    `;

    const result = await client.query(query, [ghlCalendarId]);
    return result.rows.length > 0 ? this.mapEntityMappingRow(result.rows[0]) : null;
  }

  async updateEntityMapping(id: number, updates: Partial<EntityMapping>): Promise<void> {
    const client = await this.getClient();
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    if (updates.ghlCalendarId !== undefined) {
      setClause.push(`ghl_calendar_id = $${paramIndex++}`);
      values.push(updates.ghlCalendarId);
    }

    if (updates.ghlUserId !== undefined) {
      setClause.push(`ghl_user_id = $${paramIndex++}`);
      values.push(updates.ghlUserId);
    }

    if (updates.mappingData !== undefined) {
      setClause.push(`mapping_data = $${paramIndex++}`);
      values.push(updates.mappingData ? JSON.stringify(updates.mappingData) : null);
    }

    if (updates.active !== undefined) {
      setClause.push(`active = $${paramIndex++}`);
      values.push(updates.active);
    }

    if (setClause.length === 0) return;

    values.push(id);
    const query = `
      UPDATE entity_mappings
      SET ${setClause.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
    `;

    await client.query(query, values);
  }

  // Sync Logs
  async createSyncLog(log: Omit<SyncLog, 'id' | 'processedAt'>): Promise<void> {
    const client = await this.getClient();
    const query = `
      INSERT INTO sync_logs (sync_type, entity_type, entity_id, action, status, error_message, retry_count, request_payload, response_payload, execution_time_ms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    await client.query(query, [
      log.syncType,
      log.entityType,
      log.entityId,
      log.action,
      log.status,
      log.errorMessage,
      log.retryCount,
      log.requestPayload ? JSON.stringify(log.requestPayload) : null,
      log.responsePayload ? JSON.stringify(log.responsePayload) : null,
      log.executionTimeMs
    ]);
  }

  async getRecentSyncLogs(limit: number = 100): Promise<SyncLog[]> {
    const client = await this.getClient();
    const query = `
      SELECT * FROM sync_logs
      ORDER BY processed_at DESC
      LIMIT $1
    `;

    const result = await client.query(query, [limit]);
    return result.rows.map(this.mapSyncLogRow);
  }

  async getSyncLogsByEntity(entityType: string, entityId: string, limit: number = 50): Promise<SyncLog[]> {
    const client = await this.getClient();
    const query = `
      SELECT * FROM sync_logs
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY processed_at DESC
      LIMIT $3
    `;

    const result = await client.query(query, [entityType, entityId, limit]);
    return result.rows.map(this.mapSyncLogRow);
  }

  // Prenotazioni Cache
  async savePrenotazioneCache(cache: Omit<PrenotazioneCache, 'createdAt'>): Promise<void> {
    const client = await this.getClient();
    const query = `
      INSERT INTO prenotazioni_cache (cup_prenotazione_id, ghl_event_id, data_prestazione, status, checksum, sync_data, last_sync)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (cup_prenotazione_id)
      DO UPDATE SET
        ghl_event_id = EXCLUDED.ghl_event_id,
        status = EXCLUDED.status,
        checksum = EXCLUDED.checksum,
        sync_data = EXCLUDED.sync_data,
        last_sync = EXCLUDED.last_sync
    `;

    await client.query(query, [
      cache.cupPrenotazioneId,
      cache.ghlEventId,
      cache.dataPrestzaione,
      cache.status,
      cache.checksum,
      cache.syncData ? JSON.stringify(cache.syncData) : null,
      cache.lastSync
    ]);
  }

  async getPrenotazioneCache(cupPrenotazioneId: number): Promise<PrenotazioneCache | null> {
    const client = await this.getClient();
    const query = `
      SELECT * FROM prenotazioni_cache
      WHERE cup_prenotazione_id = $1
    `;

    const result = await client.query(query, [cupPrenotazioneId]);
    return result.rows.length > 0 ? this.mapPrenotazioneCacheRow(result.rows[0]) : null;
  }

  async getPrenotazioneCacheByGHLEvent(ghlEventId: string): Promise<PrenotazioneCache | null> {
    const client = await this.getClient();
    const query = `
      SELECT * FROM prenotazioni_cache
      WHERE ghl_event_id = $1
    `;

    const result = await client.query(query, [ghlEventId]);
    return result.rows.length > 0 ? this.mapPrenotazioneCacheRow(result.rows[0]) : null;
  }

  // Indisponibilità Cache
  async saveIndisponibilitaCache(cache: Omit<IndisponibilitaCache, 'createdAt' | 'updatedAt'>): Promise<void> {
    const client = await this.getClient();
    const query = `
      INSERT INTO indisponibilita_cache (ghl_event_id, cup_indisponibilita_id, cup_dottore_id, cup_sede_id, start_time, end_time, event_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (ghl_event_id)
      DO UPDATE SET
        cup_indisponibilita_id = EXCLUDED.cup_indisponibilita_id,
        cup_dottore_id = EXCLUDED.cup_dottore_id,
        cup_sede_id = EXCLUDED.cup_sede_id,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        event_data = EXCLUDED.event_data,
        updated_at = NOW()
    `;

    await client.query(query, [
      cache.ghlEventId,
      cache.cupIndisponibilitaId,
      cache.cupDottoreId,
      cache.cupSedeId,
      cache.startTime,
      cache.endTime,
      cache.eventData ? JSON.stringify(cache.eventData) : null
    ]);
  }

  async getIndisponibilitaCache(ghlEventId: string): Promise<IndisponibilitaCache | null> {
    const client = await this.getClient();
    const query = `
      SELECT * FROM indisponibilita_cache
      WHERE ghl_event_id = $1
    `;

    const result = await client.query(query, [ghlEventId]);
    return result.rows.length > 0 ? this.mapIndisponibilitaCacheRow(result.rows[0]) : null;
  }

  async deleteIndisponibilitaCache(ghlEventId: string): Promise<void> {
    const client = await this.getClient();
    const query = `DELETE FROM indisponibilita_cache WHERE ghl_event_id = $1`;
    await client.query(query, [ghlEventId]);
  }

  // Config
  async getConfig(key: string): Promise<string | null> {
    const client = await this.getClient();
    const query = `SELECT config_value FROM sync_config WHERE config_key = $1`;
    const result = await client.query(query, [key]);
    return result.rows.length > 0 ? result.rows[0].config_value : null;
  }

  async setConfig(key: string, value: string): Promise<void> {
    const client = await this.getClient();
    const query = `
      INSERT INTO sync_config (config_key, config_value)
      VALUES ($1, $2)
      ON CONFLICT (config_key)
      DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = NOW()
    `;
    await client.query(query, [key, value]);
  }

  // Queue
  async addToQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<string> {
    const client = await this.getClient();
    const query = `
      INSERT INTO sync_queue (queue_type, priority, payload, status, retry_count, max_retries, scheduled_for, started_at, completed_at, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const result = await client.query(query, [
      item.queueType,
      item.priority,
      JSON.stringify(item.payload),
      item.status,
      item.retryCount,
      item.maxRetries,
      item.scheduledFor,
      item.startedAt,
      item.completedAt,
      item.errorMessage
    ]);

    return result.rows[0].id;
  }

  async getNextQueueItems(limit: number = 10): Promise<SyncQueueItem[]> {
    const client = await this.getClient();
    const query = `
      SELECT * FROM sync_queue
      WHERE status = 'pending' AND scheduled_for <= NOW()
      ORDER BY priority DESC, created_at ASC
      LIMIT $1
    `;

    const result = await client.query(query, [limit]);
    return result.rows.map(this.mapSyncQueueItemRow);
  }

  async updateQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const client = await this.getClient();
    const setClause: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt') {
        const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        setClause.push(`${columnName} = $${paramIndex++}`);

        if (key === 'payload') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    if (setClause.length === 0) return;

    values.push(id);
    const query = `
      UPDATE sync_queue
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await client.query(query, values);
  }

  // Helper methods to map database rows to interfaces
  private mapEntityMappingRow(row: any): EntityMapping {
    return {
      id: row.id,
      cupType: row.cup_type,
      cupId: row.cup_id,
      ghlCalendarId: row.ghl_calendar_id,
      ghlUserId: row.ghl_user_id,
      mappingData: row.mapping_data ? JSON.parse(row.mapping_data) : undefined,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapSyncLogRow(row: any): SyncLog {
    return {
      id: row.id,
      syncType: row.sync_type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      status: row.status,
      errorMessage: row.error_message,
      retryCount: row.retry_count,
      requestPayload: row.request_payload ? JSON.parse(row.request_payload) : undefined,
      responsePayload: row.response_payload ? JSON.parse(row.response_payload) : undefined,
      executionTimeMs: row.execution_time_ms,
      processedAt: row.processed_at
    };
  }

  private mapPrenotazioneCacheRow(row: any): PrenotazioneCache {
    return {
      cupPrenotazioneId: row.cup_prenotazione_id,
      ghlEventId: row.ghl_event_id,
      dataPrestzaione: row.data_prestazione,
      status: row.status,
      checksum: row.checksum,
      syncData: row.sync_data ? JSON.parse(row.sync_data) : undefined,
      lastSync: row.last_sync,
      createdAt: row.created_at
    };
  }

  private mapIndisponibilitaCacheRow(row: any): IndisponibilitaCache {
    return {
      ghlEventId: row.ghl_event_id,
      cupIndisponibilitaId: row.cup_indisponibilita_id,
      cupDottoreId: row.cup_dottore_id,
      cupSedeId: row.cup_sede_id,
      startTime: row.start_time,
      endTime: row.end_time,
      eventData: row.event_data ? JSON.parse(row.event_data) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapSyncQueueItemRow(row: any): SyncQueueItem {
    return {
      id: row.id,
      queueType: row.queue_type,
      priority: row.priority,
      payload: JSON.parse(row.payload),
      status: row.status,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      scheduledFor: row.scheduled_for,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      errorMessage: row.error_message,
      createdAt: row.created_at
    };
  }
}

export const dbService = new DatabaseService();