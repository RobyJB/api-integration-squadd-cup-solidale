import { Client } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { config } from './env';
import { logger } from '../utils/logger';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private pgClient: Client | null = null;
  private redisClient: RedisClientType | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connectPostgres(): Promise<Client> {
    if (this.pgClient) {
      return this.pgClient;
    }

    try {
      this.pgClient = new Client({
        connectionString: config.database.url,
        ssl: config.env === 'production' ? { rejectUnauthorized: false } : false
      });

      await this.pgClient.connect();
      logger.info('PostgreSQL connected successfully');

      // Test connection
      await this.pgClient.query('SELECT NOW()');

      return this.pgClient;
    } catch (error) {
      logger.error('PostgreSQL connection failed:', error);
      throw error;
    }
  }

  async connectRedis(): Promise<RedisClientType> {
    if (this.redisClient) {
      return this.redisClient;
    }

    try {
      this.redisClient = createClient({
        url: config.redis.url
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      await this.redisClient.connect();

      return this.redisClient;
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.pgClient) {
        await this.pgClient.end();
        this.pgClient = null;
        logger.info('PostgreSQL disconnected');
      }

      if (this.redisClient) {
        await this.redisClient.quit();
        this.redisClient = null;
        logger.info('Redis disconnected');
      }
    } catch (error) {
      logger.error('Error during database disconnection:', error);
    }
  }

  async checkHealth(): Promise<{ postgres: boolean; redis: boolean }> {
    const health = { postgres: false, redis: false };

    try {
      if (this.pgClient) {
        await this.pgClient.query('SELECT 1');
        health.postgres = true;
      }
    } catch (error) {
      logger.error('PostgreSQL health check failed:', error);
    }

    try {
      if (this.redisClient) {
        await this.redisClient.ping();
        health.redis = true;
      }
    } catch (error) {
      logger.error('Redis health check failed:', error);
    }

    return health;
  }

  getPostgresClient(): Client | null {
    return this.pgClient;
  }

  getRedisClient(): RedisClientType | null {
    return this.redisClient;
  }
}

export const dbManager = DatabaseManager.getInstance();