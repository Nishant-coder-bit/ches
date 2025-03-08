import RedisClient from './RedisClient';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class QueueWorker {
  constructor() {
    this.processQueue();
  }

  async processQueue() {
    console.log(`Inside processQueue`);
    while (true) {
      // find all keys that match the pattern 'game:*:queue'
      const keys = await RedisClient.keys('game:*:queue');
      
      for (const key of keys) {
        const value = await RedisClient.lpop(key);
     
        if (value) {
          const { gameId } = this.parseGameId(key);
          console.log(`saving move to database: ${value}`);
          await this.saveMoveToDatabase(gameId, JSON.parse(value));
        }
      }
      await new Promise(resolve => setTimeout(resolve, 2000)); // Polling interval
    }
  }

  parseGameId(queueKey: string): { gameId: string } {
    const match = /game:(.*):queue/.exec(queueKey);
    console.log(`match is ${match}`);
    return { gameId: match ? match[1] : '' };
  }

  async saveMoveToDatabase(gameId: string, value: any) {
    console.log(`Inside saveMoveToDatabase and gameId is ${gameId} and data is ${value}`);
    try {
      // Check if the game exists
      const gameExists = await prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!gameExists) {
        console.error('Game not found for gameId:', gameId);
        return;
      }

      if (value.isGameOver === true) {
        await prisma.game.update({
          where: { id: gameId },
          data: { winnerId: value.winner },
        });
      } else {
        
        await prisma.game.update({
          where: { id: gameId },
          data: { moves: value.pgn, fen: value.fen },
        });
      }

      console.log('Move stored in database:', { gameId, ...value });

    } catch (error) {
      console.error('Error saving move to database:',error);
    }
  }
}

export default new QueueWorker();
