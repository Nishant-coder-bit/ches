import { PrismaClient } from '@prisma/client';
import { GameManager } from '../GameManager';
import WebSocket from 'ws';
// import { WebSocketHandler } from '../WebSocketHandler';


const prisma = new PrismaClient();

export const gameService = {
  async getGame(gameId: string) {
    return prisma.game.findUnique({ where: { id: gameId } });
  },

  async recoverGame(gameId: string) {
    return prisma.game.findUnique({ where: { id: gameId } });
  },

  async addSpectator(gameId: string, socket: WebSocket) {
     // Placeholder for WebSocket object
    const gameManager = new GameManager();
    await gameManager.addSpectator(gameId, socket);
  },
};
