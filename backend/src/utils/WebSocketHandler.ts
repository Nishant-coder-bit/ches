import { WebSocket } from 'ws';
import RedisClient from './RedisClient';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WebSocketHandler {
  private gameParticipants: Map<string, Set<WebSocket>>;
  private gameSpectators: Map<string, Set<WebSocket>>;

  constructor() {
    this.gameParticipants = new Map();
    this.gameSpectators = new Map();
  }

  async addParticipant(gameId: any, socket: WebSocket): Promise<void> {
    if (!this.gameParticipants.has(gameId)) {
      this.gameParticipants.set(gameId, new Set());
    }
    this.gameParticipants.get(gameId)?.add(socket);

    const email = (socket as any)._userEmail;
    // const email = "abc@gmail.com";
    await RedisClient.rpush(`game:${gameId}:participants`, email);

    await prisma.participant.create({
      data: { gameId, userEmail: email }
    });
  }

  async addSpectator(gameId: string, socket: WebSocket): Promise<void> {
    if (!this.gameSpectators.has(gameId)) {
      this.gameSpectators.set(gameId, new Set());
    }
    this.gameSpectators.get(gameId)?.add(socket);

    const email = (socket as any)._userEmail;
    await RedisClient.rpush(`game:${gameId}:spectators`, email);
  }

  async handleDisconnection(gameId: string, socket: WebSocket): Promise<void> {
    const participantSet = this.gameParticipants.get(gameId);
    if (participantSet?.has(socket)) {
      participantSet.delete(socket);
      if (participantSet.size === 0) {
        this.gameParticipants.delete(gameId);
        await RedisClient.del(`game:${gameId}:participants`);
        // await prisma.participant.deleteMany({ where: { gameId } });
      }
    }

    const spectatorSet = this.gameSpectators.get(gameId);
    if (spectatorSet?.has(socket)) {
      spectatorSet.delete(socket);
      if (spectatorSet.size === 0) {
        this.gameSpectators.delete(gameId);
        await RedisClient.del(`game:${gameId}:spectators`);
      }
    }
  }

  async getParticipants(gameId: string): Promise<Set<WebSocket>> {
    return this.gameParticipants.get(gameId) || new Set();
  }

  async getSpectators(gameId: string): Promise<Set<WebSocket>> {
    return this.gameSpectators.get(gameId) || new Set();
  }

  public async recoverParticipants(gameId: string, users: WebSocket[]): Promise<void> {
    const participantEmails = await RedisClient.lpop(`game:${gameId}:participants`);
    if (participantEmails) {
      const emails = JSON.parse(participantEmails);
      emails.forEach((email: any) => {
        const user = users.find(user => (user as any)._userEmail === email);
        if (user) {
          this.addParticipant(gameId, user);
        }
      });
    }

    const dbParticipants = await prisma.participant.findMany({
      where: { gameId }
    });

    for (const participant of dbParticipants) {
      const user = users.find(user => (user as any)._userEmail === participant.userEmail);
      if (user) {
        this.addParticipant(gameId, user);
      }
    }
  }
}

