import winston from 'winston';
import { config } from '../config/env';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.colorize({ all: true })
);

export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  defaultMeta: { service: 'cup-ghl-sync' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Create logs directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

export class SyncLogger {
  static logSyncStart(syncType: string, entityType: string, entityId: string): void {
    logger.info('Sync started', {
      syncType,
      entityType,
      entityId,
      timestamp: new Date().toISOString()
    });
  }

  static logSyncSuccess(
    syncType: string,
    entityType: string,
    entityId: string,
    action: string,
    data?: any
  ): void {
    logger.info('Sync successful', {
      syncType,
      entityType,
      entityId,
      action,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static logSyncError(
    syncType: string,
    entityType: string,
    entityId: string,
    action: string,
    error: Error,
    data?: any
  ): void {
    logger.error('Sync failed', {
      syncType,
      entityType,
      entityId,
      action,
      error: error.message,
      stack: error.stack,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static logAPICall(
    service: string,
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    data?: any
  ): void {
    logger.info('API call', {
      service,
      method,
      endpoint,
      status,
      duration,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static logAPIError(
    service: string,
    method: string,
    endpoint: string,
    error: Error,
    data?: any
  ): void {
    logger.error('API call failed', {
      service,
      method,
      endpoint,
      error: error.message,
      stack: error.stack,
      data,
      timestamp: new Date().toISOString()
    });
  }
}