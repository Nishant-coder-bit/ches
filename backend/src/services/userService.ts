import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const userService = {
  async getUser(id: number) {
    return prisma.user.findUnique({ where: { id } });
  },

  async getUserGames(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    const gamesAsPlayer1 = await prisma.game.findMany({ where: { player1Id: user.id } });
    const gamesAsPlayer2 = await prisma.game.findMany({ where: { player2Id: user.id } });
    return [...gamesAsPlayer1, ...gamesAsPlayer2];
  },
};
