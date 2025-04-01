import { WebSocket } from "ws";
import { Game } from "./models/Game";
import RedisClient from "./utils/RedisClient";
import { SessionService } from "./services/SessionService";

export class GameManager {
  private activeGames: Map<string, Game> = new Map();
  private waitingPlayers: Map<string, WebSocket> = new Map(); // userId -> WebSocket

  async createGame(userId: string, ws: any): Promise<{ status: string; gameId?: string }> {
    // Store the player as waiting
    this.waitingPlayers.set(userId, ws);
    // Store in Redis that this player is waiting
    await RedisClient.client.set(`waiting_player:${userId}`, 'true'); // 5 minute timeout
    
    return {
      status: 'waiting',
      gameId: undefined,

    };
  }

  async joinGame( ws: WebSocket,userId: string): Promise<{ status: string; gameId?: string; color?: string}> {
    // Check if there's a waiting player
    const waitingPlayerId = await this.findWaitingPlayer(userId);
    
    if (!waitingPlayerId) {
      // If no waiting player, create a new game and wait
      return this.createGame(userId, ws);
    }

    const waitingPlayerWs = this.waitingPlayers.get(waitingPlayerId);
    if (!waitingPlayerWs) {
      // Waiting player disconnected, clean up and start new wait
      await RedisClient.del(`waiting_player:${waitingPlayerId}`);
      return this.createGame(userId, ws);
    }

    // Create a new game with both players
    const game = await Game.create(waitingPlayerWs, ws, waitingPlayerId, userId);
    this.activeGames.set(game.gameId, game);
    // const gameToken = SessionService.generateGameToken(userId,game.gameId);
    // Remove waiting player
    this.waitingPlayers.delete(waitingPlayerId);
    await RedisClient.del(`waiting_player:${waitingPlayerId}`);

    // Store game association for both players
    await Promise.all([
      RedisClient.set(`user:${waitingPlayerId}:game`, game.gameId),
      RedisClient.set(`user:${userId}:game`, game.gameId)
    ]);

    return {
      status: 'ready',
      gameId: game.gameId,
      color: 'black', 
    
      
    };
  }

  async handleReconnection(ws: WebSocket, userId: string): Promise<void> {
    // Check if user was in a game
    const gameId = await RedisClient.get(`user:${userId}:game`);
    if (!gameId) return;

    const game = this.activeGames.get(gameId);
    if (!game) {
      // Game exists in Redis but not in memory - restore it
      const gameState = await RedisClient.get(`game:${gameId}`);
      if (gameState) {
        const parsedState = JSON.parse(gameState);
        const restoredGame = await Game.restore(gameId, parsedState);
        this.activeGames.set(gameId, restoredGame);
        await restoredGame.reconnectPlayer(ws, userId);
      }
    } else {
      // Game exists - reconnect player
      await game.reconnectPlayer(ws, userId);
    }
  }

  async getGame(userId: string): Promise<Game | null> {
    // First check if user is in a game
    const gameId = await RedisClient.get(`user:${userId}:game`);
    if (!gameId) return null;

    // Check if game is in memory
    let game = this.activeGames.get(gameId);
    if (game) return game;

    // If not in memory, try to restore from Redis
    const gameState = await RedisClient.get(`game:${gameId}`);
    if (!gameState) return null;

    try {
      const parsedState = JSON.parse(gameState);
      game = await Game.restore(gameId, parsedState);
      this.activeGames.set(gameId, game);
      return game;
    } catch (error) {
      console.error('Failed to restore game:', error);
      return null;
    }
  }
  private async findWaitingPlayer(excludeUserId: string): Promise<string | null> {
    const waitingPlayers = await RedisClient.keys('waiting_player:*');
    for (const key of waitingPlayers) {
      const waitingPlayerId = key.split(':')[1];
      if (waitingPlayerId !== excludeUserId) {
        return waitingPlayerId;
      }
    }
    return null;
  }
}