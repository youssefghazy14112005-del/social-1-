import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
loadEnv({ path: resolve(`.env.${NODE_ENV}`) });

const required = (key: string, fallback = ''): string => process.env[key] ?? fallback;
const positiveInt = (key: string, fallback: number): number => {
  const value = Number.parseInt(process.env[key] ?? String(fallback), 10);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${key} must be a positive integer`);
  return value;
};
const list = (key: string): string[] => (process.env[key] ?? '').split(',').map((v) => v.trim()).filter(Boolean);

export const PORT = positiveInt('PORT', 9000);
export const DB_URI = required('DB_URI', 'mongodb://127.0.0.1:27017/social_app');
export const REDIS_URI = required('REDIS_URI', 'redis://127.0.0.1:6379');
export const APP_EMAIL = required('APP_EMAIL');
export const APP_PASSWORD = required('APP_PASSWORD');
export const ENC_KEY = required('ENC_KEY', '0123456789abcdef0123456789abcdef');
export const IV_LENGTH = positiveInt('IV_LENGTH', 16);
export const ACCESS_USER_TOKEN_SIGNATURE = required('ACCESS_USER_TOKEN_SIGNATURE');
export const ACCESS_ADMIN_TOKEN_SIGNATURE = required('ACCESS_ADMIN_TOKEN_SIGNATURE');
export const REFRESH_USER_TOKEN_SIGNATURE = required('REFRESH_USER_TOKEN_SIGNATURE');
export const REFRESH_ADMIN_TOKEN_SIGNATURE = required('REFRESH_ADMIN_TOKEN_SIGNATURE');
export const ACCESS_TOKEN_EXPIRES_IN = positiveInt('ACCESS_TOKEN_EXPIRES_IN', 1800);
export const REFRESH_TOKEN_EXPIRES_IN = positiveInt('REFRESH_TOKEN_EXPIRES_IN', 31536000);
export const WEB_CLIENT_IDS = list('WEB_CLIENT_IDS');
export const ORIGINS = list('ORIGINS');
export const FACEBOOK = required('FACEBOOK');
export const INSTAGRAM = required('INSTAGRAM');
export const TWITTER = required('TWITTER');

if (Buffer.byteLength(ENC_KEY, 'utf8') !== 32) throw new Error('ENC_KEY must be exactly 32 bytes for AES-256-CBC');
if (!Number.isInteger(IV_LENGTH) || IV_LENGTH !== 16) throw new Error('IV_LENGTH must be 16 for AES-CBC');
