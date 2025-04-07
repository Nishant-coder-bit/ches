// src/services/SessionService.ts (NEW)
import jwt from 'jsonwebtoken';
// import { JWT_SECRET} from '../config';
import { PrismaClient } from '@prisma/client';
const JWT_SECRET = '12345';
const prisma = new PrismaClient();

export class SessionService {
  // Generate JWT with game context
  static generateGameToken(userId: string, gameId: string): string {
    return jwt.sign({ userId, gameId }, JWT_SECRET, { expiresIn: '1h' });
  }
  static async validateAuthToken(token: string): Promise<any| null> {
    try {
      return jwt.verify(token, JWT_SECRET) as { email: string };
    } catch (error) {
      return null;
    }
  }

  // Validate game session token
  static async validateGameToken(token: string): Promise<{ userId: string; gameId: string } | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; gameId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Get user ID from email
  static async getUserId(email: string): Promise<number | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.replace(/^"|"$/g, '') },
      select: { id: true }
    });
    return Number(user?.id) || null;
  }
}