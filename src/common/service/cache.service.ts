import { createClient, type RedisClientType } from 'redis';
import { REDIS_URI } from '../../config.js';
class CacheService {
  private readonly client: RedisClientType = createClient({ url: REDIS_URI });
  private connected = false;
  constructor() { this.client.on('error', (error) => console.error('Redis error:', error.message)); }
  async connect(): Promise<void> { if (!this.connected) { await this.client.connect(); this.connected = true; console.log('REDIS CONNECTED'); } }
  async set<T>(options: { key: string; value: T; ttl?: number }): Promise<void> {
    const value = typeof options.value === 'string' ? options.value : JSON.stringify(options.value);
    if (options.ttl) await this.client.set(options.key, value, { EX: options.ttl }); else await this.client.set(options.key, value);
  }
  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.client.get(key); if (value === null) return null;
    try { return JSON.parse(value) as T; } catch { return value as T; }
  }
  ttl(key: string) { return this.client.ttl(key); }
  expire(key: string, seconds: number) { return this.client.expire(key, seconds); }
  del(...keys: string[]) { return this.client.del(keys); }
  exists(key: string) { return this.client.exists(key); }
  keys(pattern: string) { return this.client.keys(pattern); }
  incrBy(key: string, increment: number) { return this.client.incrBy(key, increment); }
  async quit(): Promise<void> { if (this.connected) { await this.client.quit(); this.connected = false; } }
}
export const cacheService = new CacheService();
