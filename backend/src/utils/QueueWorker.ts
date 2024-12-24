import RedisClient from './RedisClient';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class QueueWorker {
  constructor() {
    this.processQueue();
  }

  async processQueue() {
    while (true) {
      const keys = await RedisClient.keys('game:*:queue');
      for (const key of keys) {
        const move = await RedisClient.lpop(key);
        if (move) {
          const { gameId } = this.parseGameId(key);
          await this.saveMoveToDatabase(gameId, JSON.parse(move));
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Polling interval
    }
  }

  parseGameId(queueKey: string): { gameId: string } {
    const match = /game:(.*):queue/.exec(queueKey);
    return { gameId: match ? match[1] : '' };
  }

  async saveMoveToDatabase(gameId: string, data: any) {
    try {
      // Check if the game exists
      const gameExists = await prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!gameExists) {
        console.error('Game not found for gameId:', gameId);
        return;
      }

      if (data.gameOver) {
        await prisma.game.update({
          where: { id: gameId },
          data: { winner: data.winner },
        });
      } else {
        console.log("gameId:---->", gameId);
        console.log("data---->", data);
        await prisma.game.update({
          where: { id: gameId },
          data: { moves: data.pgn, fen: data.fen },
        });
      }

      console.log('Move stored in database:', { gameId, ...data });

    } catch (error) {
      console.error('Error saving move to database:',error);
    }
  }
}

export default new QueueWorker();
