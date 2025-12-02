import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  HOST: Joi.string().default('0.0.0.0'),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // CUP Solidale
  CUP_ENVIRONMENT: Joi.string().valid('sandbox', 'prod').default('sandbox'),
  CUP_SOLIDALE_COMPANY_CODE: Joi.string().required(),
  CUP_SOLIDALE_API_KEY: Joi.string().required(),
  CUP_SOLIDALE_SEDE_ID: Joi.string().optional(),

  // GoHighLevel
  GHL_API_KEY: Joi.string().required(),
  GHL_LOCATION_ID: Joi.string().required(),

  // Database (opzionale per ora)
  DATABASE_URL: Joi.string().optional(),
  REDIS_URL: Joi.string().optional(),

  // Sync Configuration
  SYNC_INTERVAL_MINUTES: Joi.number().default(5),
  MAX_RETRIES: Joi.number().default(3),
  BATCH_SIZE: Joi.number().default(100),
  WEBHOOK_SECRET: Joi.string().default('default-webhook-secret-change-me'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // CORS
  CORS_ORIGINS: Joi.string().optional()
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  host: envVars.HOST,
  logLevel: envVars.LOG_LEVEL,

  cup: {
    environment: envVars.CUP_ENVIRONMENT,
    companyCode: envVars.CUP_SOLIDALE_COMPANY_CODE,
    apiKey: envVars.CUP_SOLIDALE_API_KEY,
    sedeId: envVars.CUP_SOLIDALE_SEDE_ID,
    baseUrl: envVars.CUP_ENVIRONMENT === 'prod'
      ? 'https://api.cupsolidale.it/api/v1'
      : 'https://sandboxapi.cupsolidale.it/api/v1'
  },

  ghl: {
    apiToken: envVars.GHL_API_KEY,
    locationId: envVars.GHL_LOCATION_ID,
    baseUrl: 'https://services.leadconnectorhq.com'
  },

  database: {
    url: envVars.DATABASE_URL
  },

  redis: {
    url: envVars.REDIS_URL
  },

  sync: {
    intervalMinutes: envVars.SYNC_INTERVAL_MINUTES,
    maxRetries: envVars.MAX_RETRIES,
    batchSize: envVars.BATCH_SIZE
  },

  webhook: {
    secret: envVars.WEBHOOK_SECRET
  },

  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS
  },

  cors: {
    origins: envVars.CORS_ORIGINS?.split(',') || ['*']
  }
};

export type Config = typeof config;