import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const userService = {

  async getUser(email: string) {
    return prisma.user.findUnique(
      { 
        where: { 
        email
       } ,select:{
         name:true,
         email:true
       }
  });
  },

  async getUserGames(email: string) {
    console.log("reached inside get user games");
    console.log("user email", email);
    const user = await prisma.user.findFirst({ 
      where: { 
        email
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
 
    const gamesAsPlayer1 = await prisma.game.findMany({ where: { player1Id: user?.id} });
    console.log("games as player 1", gamesAsPlayer1);
  
    const gamesAsPlayer2 = await prisma.game.findMany({ where: { player2Id: user?.id } });
    console.log("games as player 2", gamesAsPlayer2);
    console.log("games as player 1 and 2", [...gamesAsPlayer1, ...gamesAsPlayer2]);

    return [...gamesAsPlayer1, ...gamesAsPlayer2];
  },
};
