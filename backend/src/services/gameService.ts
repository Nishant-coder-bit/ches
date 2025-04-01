import { PrismaClient } from '@prisma/client';

import RedisClient, { RedisSubscriber } from '../utils/RedisClient';



const prisma = new PrismaClient();

export const gameService = {
  async getGame(gameId: string) {
    return prisma.game.findUnique({ where: { id: gameId } });
  },

  async recoverGame(gameId: string) {
    return prisma.game.findUnique({ where: { id: gameId } });
  },

  async addSpectator(gameId: string) {
    console.log(`Adding spectator to game: ${gameId}`);
     
      try{

        RedisSubscriber.subscribe(gameId, (err) => {
          if (err) throw err;
        });
      }catch(err){
        console.error(`Failed to subscribe to ${gameId}:`, err);
        throw err

      }
     
  },

  async getGamesByStatus(status:any) {
    try {
      const games = await prisma.game.findMany({
        where: { status: status },
        select: { id: true, player1Id: true, player2Id: true }, 
      });
      console.log(`games are  ${games}`);
       return games;
    } catch (error) {
      console.error("Error fetching ongoing games:", error);
      throw error;
    }
  },
  
};
