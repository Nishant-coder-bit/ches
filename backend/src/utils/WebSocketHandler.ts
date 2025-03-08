import { WebSocket } from 'ws';
import RedisClient, { RedisSubscriber } from './RedisClient';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WebSocketHandler {
  private gameParticipants: Map<string, Set<WebSocket>>;
  private spectators: Map<string, Set<WebSocket>>;

  constructor() {
    this.gameParticipants = new Map();
    this.spectators = new Map();
  }

  async addParticipant(gameId: any, socket: WebSocket): Promise<void> {
    console.log(`inside add participant and gameId is ${gameId} and socket is ${socket}`);
    let count = 0;
    if (!this.gameParticipants.has(gameId)) {
      this.gameParticipants.set(gameId, new Set());
    }
    this.gameParticipants.get(gameId)?.add(socket);

    const email = (socket as any)._userEmail.replace(/^"|"$/g, '');
    // const email = "abc@gmail.com";
    console.log("email",email);
    // TODO: why are we rpushing the email to the list of participants in redis? is it correct
    await RedisClient.rpush(`game:${gameId}:participants`, email);

    await prisma.participant.upsert({
      where:{gameId_userEmail:{gameId:gameId,userEmail:email}},
      create:{gameId:gameId,userEmail:email,createdAt:new Date()},
      update:{gameId:gameId,userEmail:email}
    });
    count++;
    console.log(`added participant ${email} to game ${gameId} and count is ${count}`);
  }

  async addSpectator(gameId: string, ws: WebSocket) {
    console.log(`Adding spectator to game: ${gameId}`);

    if (!this.spectators.has(gameId)) {
      this.spectators.set(gameId, new Set());
    }

    this.spectators.get(gameId)!.add(ws);

    // Subscribe to Redis game updates
    await RedisSubscriber.subscribe(gameId);

    RedisSubscriber.on("message", (channel, message) => {
      if (channel === gameId) {
        console.log(`Sending update to spectators of game ${gameId}`);
        this.spectators.get(gameId)?.forEach((spectator) => {
          spectator.send(message);
        });
      }
    });

    ws.send(JSON.stringify({ message: "Spectating game", gameId }));

  

  }

  // async handleDisconnection(gameId: string, socket: WebSocket): Promise<void> {
  //   const participantSet = this.gameParticipants.get(gameId);
  //   if (participantSet?.has(socket)) {
  //     participantSet.delete(socket);
  //     if (participantSet.size === 0) {
  //       this.gameParticipants.delete(gameId);
  //       await RedisClient.del(`game:${gameId}:participants`);
  //       // await prisma.participant.deleteMany({ where: { gameId } });
  //     }
  //   }

  //   const spectatorSet = this.gameSpectators.get(gameId);
  //   if (spectatorSet?.has(socket)) {
  //     spectatorSet.delete(socket);
  //     if (spectatorSet.size === 0) {
  //       this.gameSpectators.delete(gameId);
  //       await RedisClient.del(`game:${gameId}:spectators`);
  //     }
  //   }
  // }

  // async getParticipants(gameId: string): Promise<Set<WebSocket>> {
  //   return this.gameParticipants.get(gameId) || new Set();
  // }

  // async getSpectators(gameId: string): Promise<Set<WebSocket>> {
  //   return this.gameSpectators.get(gameId) || new Set();
  // }

  public async recoverParticipants(gameId: string, users: WebSocket[]): Promise<any> {
    console.log(`inside recover participants and gameId is ${gameId} and users are ${users}`);
    const participantEmails = await RedisClient.lpop(`game:${gameId}:participants`);
    console.log("participantEmails",participantEmails);
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
        console.log("adding participants from db to game participants",user);
        this.addParticipant(gameId, user);
      }
    }
    console.log("recover participants done");
    return Promise.resolve({done:true, dbParticipants,participantEmails});
  }
  
}

