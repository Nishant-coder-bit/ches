import Redis from 'ioredis';

class RedisClient {
  public client: Redis;

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

  async subscribe(channel: string): Promise<void> {
     await this.client.subscribe(channel);

  }

  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async expire(key:string,value:any): Promise<void> {
    await this.client.expire(key,value);
  }
  async reconnect(): Promise<void> {
    await this.client.disconnect();
    await this.connect();
  }
}
export const RedisPublisher = new Redis(); 
export const RedisSubscriber = new Redis(); 
export default new RedisClient();
