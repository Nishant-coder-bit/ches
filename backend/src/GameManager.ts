import { WebSocket } from "ws";
import { Game } from "./models/Game";
import RedisClient from "./utils/RedisClient";
import { SessionService } from "./services/SessionService";
import { PrismaClient } from "@prisma/client";
const TIMETOLIVE = 60*5; // 5 minutes
const client = new PrismaClient();
export class GameManager {
  private activeGames: Map<string, Game> = new Map();
  private waitingPlayers: Map<string, WebSocket> = new Map(); // userId -> WebSocket

  async createGame(userId: string, ws: any): Promise<{ status: string; gameId?: string }> {
    // Store the player as waiting
    this.waitingPlayers.set(userId, ws);
    // Store in Redis that this player is waiting
    await RedisClient.client.set(`waiting_player:${userId}`, 'true',"EX",TIMETOLIVE); // 5 minute timeout
    
    return {
      status: 'waiting',
      gameId: undefined,
    };
  }
  async stopGame(gameId: string,userId:string) {
    console.log(`insid stopGame with ${gameId} and ${userId}`);
    const game = this.activeGames.get(gameId);
     console.log("inside stopGame",game);
    if (game) {
      this.activeGames.delete(gameId);
      console.log("gameId deleted from activeGames",gameId);
      await RedisClient.del(`game:${gameId}`);
       // how to delete key from redis 
       //update the status in db
          const gameToBeStopped = await client.game.findUnique({
        where: { id: gameId },
        select: { player1Id: true, player2Id: true }
      });
      console.log("gameToBeStopped",gameToBeStopped);
      if (!gameToBeStopped) return;
      await RedisClient.del(`user:${gameToBeStopped.player1Id}:game`);
      await RedisClient.del(`user:${gameToBeStopped.player2Id}:game`);
      const winnerId = gameToBeStopped.player1Id === userId ? gameToBeStopped.player2Id : gameToBeStopped.player1Id;
       await client.game.update({
        where: { id: gameId },
        data: { status: 'COMPLETED',   winnerId: winnerId  }
      
    });
    return {
      status: 'stopped',
      winnerId: winnerId
    }
    }
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

    return {
      status: 'ready',
      gameId: game.gameId,
      color: 'black', 
    
      
    };
  }

  async handleReconnection(ws: WebSocket, userId: any): Promise<void> {
    // Check if user was in a game
    const gameId = await RedisClient.get(`user:${userId}:game`);
    if (!gameId) return;

    const game = this.activeGames.get(gameId);
    if (!game) {
      // Game exists in Redis but not in memory - restore it
      const gameState = await RedisClient.get(`game:${gameId}`);
      if (gameState) {
        const parsedState = JSON.parse(gameState);

        const restoredGame:Game = await Game.restore(gameId, parsedState);
        this.activeGames.set(gameId, restoredGame);

        await restoredGame.reconnectPlayer(ws, userId);
        console.log("Game is restored for userId:", userId);
      }
    } else {
      // Game exists - reconnect player
      await game.reconnectPlayer(ws, userId);
      console.log("is connected to active Game",userId);
    }
  }

  async getGame(userId: string): Promise<any> {
    // First check if user is in a game
    const gameId = await RedisClient.get(`user:${userId}:game`);
    if (!gameId) return null;

    // Check if game is in memory
    let game = this.activeGames.get(gameId);
    if (game) return game;

    // If not in memory, try to restore from Redis
    const gameFromRedis = await RedisClient.get(`user:${userId}:game`);
    if (!gameFromRedis) return null;
    return gameFromRedis;

    // try {
     
    //   const parsedState = JSON.parse(gameState);
    //   game = await Game.restore(gameId, parsedState);
    //   if (!game) return null;
    //   this.activeGames.set(gameId, game);
    //   return game;
    // } catch (error) {
    //   console.error('Failed to restore game:', error);
    //   return null;
    // }
  }
  private async findWaitingPlayer(excludeUserId: string): Promise<string | null> {
    const waitingPlayers = await RedisClient.keys('waiting_player:*');
    for (const key of waitingPlayers) {
      const waitingPlayerId = key.split(':')[1];
      if (waitingPlayerId !== excludeUserId) {
        //matching should be done here using matching engine service
        return waitingPlayerId;
      }
    }
    return null;
  }
}