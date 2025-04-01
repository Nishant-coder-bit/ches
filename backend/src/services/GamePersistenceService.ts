// src/services/GamePersistenceService.ts (NEW)
import RedisClient from '../utils/RedisClient';

export class GamePersistenceService {
  private static MAX_CONCURRENT_GAMES:any = 100; // Adjust based on your infrastructure
  
  static async canCreateNewGame(): Promise<boolean> {
    const currentGames = await RedisClient.get('concurrent_games_count') || 0;
    return currentGames < this.MAX_CONCURRENT_GAMES;
  }

  static async trackNewGame(gameId: string): Promise<void> {
    await RedisClient.client.incr('concurrent_games_count');
    await RedisClient.set(`game:${gameId}:status`, 'waiting');
    await RedisClient.expire(`game:${gameId}:status`, 86400); // 24h expiration
  }

  static async cleanupGame(gameId: string): Promise<void> {
    await RedisClient.client.decr('concurrent_games_count');
    await RedisClient.del(`game:${gameId}:status`);
  }
}