import { WebSocket } from "ws";
import { INIT_GAME, JOIN_SPECTATOR, MOVE } from "./utils/Message";
import {  PrismaClient, User } from "@prisma/client";
import { Game } from "./models/Game";
import { WebSocketHandler } from "./utils/WebSocketHandler";
const client = new PrismaClient();
const webSocketHandler = new WebSocketHandler();
export class GameManager {
  private games: Game[];
  private pendingUser: WebSocket | null;

  private users: WebSocket[];

  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.users = [];
  }

  async addUser(socket: WebSocket) {
    this.users.push(socket);
    await this.recoverGames(socket);
    this.addHandler(socket);
  }
  async recoverGames(socket: WebSocket) {
    const gameId = await this.getGameId(socket);
    if (gameId) {
      await webSocketHandler.recoverParticipants(gameId, this.users);
    }
  }

  private getGameId(socket: WebSocket): string | undefined {
    const game = this.games.find(
      (game) => game.player1 === socket || game.player2 === socket
    );
    return game ? game.gameId : undefined;
  }
  removeUser(socket: WebSocket) {
    const user = this.users.filter((user) => user !== socket);
    if (this.pendingUser === socket) {
      this.pendingUser = null;
    }
    this.games = this.games.filter(
      (game) => game.player1 !== socket && game.player2 !== socket
    );
    //remove the user
  }
  private addHandler(socket: WebSocket) {
    socket.on("message", async (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === INIT_GAME) {
        if(this.pendingUser === socket){
          console.log("try playing with new player , this is not allowed");
        }
      else  if (this.pendingUser ) {
          //start the game
          console.log("(socket as any)._userEmail",(socket as any)._userEmail);
          console.log("(this.pendingUser as any)._userEmail",(this.pendingUser as any)._userEmail);
          const player1Id = await client.user.findUnique({
            where: {
              email: (socket as any)._userEmail,
            },
            select: {
              id: true,
            },
          });
          console.log("player1Id", player1Id);
          console.log("--------------------");
        
          const player2Id = await client.user.findUnique({
            where: {
              email:  (this.pendingUser as any)._userEmail,
            },
            select: {
              id: true,
            },
          });
            console.log("player2Id",player2Id);

          const game =await Game.create(this.pendingUser, socket, player1Id?.id, player2Id?.id);
          this.games.push( game);
          await webSocketHandler.addParticipant,(game.gameId,this.pendingUser);
          await webSocketHandler.addParticipant(game.gameId, socket);
          console.log("game initailised");
          this.pendingUser = null;
        } else {
          this.pendingUser = socket;
          console.log("Waiting for another player...");
        }
      }

      if (message.type === MOVE) {
        console.log(this.users);
        // console.log(socket);
        const game = this.games.find(
          (game) => game.player1 === socket || game.player2 === socket
        );
        if (game) {
          console.log("inside game");
          console.log("----------------------");
          console.log("game inside move ", game);
          game.makeMove(socket, message.payload);
        }
      }
      if (message.type === JOIN_SPECTATOR) {
        const gameId = message.payload.gameId;
        await this.addSpectator(gameId, socket);
      }
    });
  }
  async addSpectator(gameId: string, socket: WebSocket) {
    await webSocketHandler.addSpectator(gameId, socket);
  }
}
