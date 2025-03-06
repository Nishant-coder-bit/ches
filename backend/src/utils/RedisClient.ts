import Redis from 'ioredis';

class RedisClient {
  private client: Redis;

  constructor() {
    this.client = new Redis();  // connect to 127.0.0.1:6379
    // this.client.on('message', (channel:any, message:any) => {
    //   console.log(`Received message from channel ${channel}: ${message}`);
    // })
  }
  

  

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async rpush(key: string, value: string): Promise<void> {
     console.log("key-------->",key);
     console.log("value---------------->",value);  
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

  async reconnect(): Promise<void> {
    await this.client.disconnect();
    await this.connect();
  }
}
export const RedisPublisher = new Redis(); // For publishing game updates
export const RedisSubscriber = new Redis(); // For subscribing to game updates
export default new RedisClient();
