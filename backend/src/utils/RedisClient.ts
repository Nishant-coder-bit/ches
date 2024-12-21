import Redis from 'ioredis';

class RedisClient {
  private client: Redis;

  constructor() {
    this.client = new Redis();
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async rpush(key: string, value: string): Promise<void> {
    await this.client.rpush(key, value);
  }

  async lpop(key: string): Promise<string | null> {
    return await this.client.lpop(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async reconnect(): Promise<void> {
    await this.client.disconnect();
    await this.connect();
  }
}

export default new RedisClient();
