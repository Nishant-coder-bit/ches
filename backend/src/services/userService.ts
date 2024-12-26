import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const userService = {
  async getUser(id: number) {
    return prisma.user.findUnique({ where: { id } });
  },

  async getUserGames(id: number) {
    console.log("reached inside get user games");
     console.log(typeof(id));

    const user = await prisma.user.findFirst({ 
      where: { 
        id :id
      } ,
      select:{
        name:true,
        id:true,
      }
      
    });
    console.log("user info", user);
    // if (!user) {
    //   throw new Error('User not found');
    // }
 
    const gamesAsPlayer1 = await prisma.game.findMany({ where: { player1Id: id } });
    console.log("games as player 1", gamesAsPlayer1);
  
    const gamesAsPlayer2 = await prisma.game.findMany({ where: { player2Id: id } });
    console.log("games as player 2", gamesAsPlayer2);
    console.log("games as player 1 and 2", [...gamesAsPlayer1, ...gamesAsPlayer2]);

    return [...gamesAsPlayer1, ...gamesAsPlayer2];
  },
};
