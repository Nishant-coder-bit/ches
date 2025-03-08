import { WebSocket } from "ws";
import { INIT_GAME, JOIN_SPECTATOR, MOVE } from "./utils/Message";
import {  PrismaClient, User } from "@prisma/client";
import { Game } from "./models/Game";
import { WebSocketHandler } from "./utils/WebSocketHandler";
import RedisClient, { RedisPublisher } from "./utils/RedisClient";
const client = new PrismaClient();
const webSocketHandler = new WebSocketHandler();
export class GameManager {
  private games: Game[];
  private pendingUser: WebSocket | null;

  private users: WebSocket[];
  private countTotalGames: number = 0;
  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.users = [];
  }
  // utility function to get id of user
  async getIdOfUser(email:string){
    const user = await client.user.findUnique({
      where: { email: email },
      select: { id: true }
    });
    console.log("inside getIdOfUser",user?.id);
    return user?.id;
  }


  async addUser(socket: WebSocket) {
    this.users.push(socket);
    const email = (socket as any)._userEmail.replace(/^"|"$/g, '');

    const id = this.getIdOfUser(email);
 
    const gameId = await RedisClient.get(`user:${id}:game`); 
   
    if (gameId) {
      const gameState = await RedisClient.get(`game:${gameId}`);
      
      if (gameState) {
        // Send restored state to user
        socket.send(JSON.stringify({ type: INIT_GAME, payload: JSON.parse(gameState) })); 
      }

     const recoveredPromise =  await this.recoverGames(gameId);
 
      const value = await recoveredPromise.resolve();
      if (value.done === true) {
        console.log("game recovered");
        return;
      }
    }
     
    this.addHandler(socket);
  }
  async recoverGames(gameId: string):Promise<any> {
    console.log("inside recover games");
    if (gameId) {
     const returnedPromise  =   await webSocketHandler.recoverParticipants(gameId, this.users);
     const value =await returnedPromise.resolve();
      console.log("value",value);
      if(value.done === true){
        console.log("game recovered");
        return new Promise((resolve, reject) => {
          resolve(value); 
        }
        )
      }
      
    }
    return new Promise((resolve, reject) => {
      resolve({done:false});
    });
  }
  
  async removeUser(socket: WebSocket) {
    console.log("inside remove user");
    const user = this.users.filter((user) => user !== socket);
    if (this.pendingUser === socket) {
      this.pendingUser = null;
    }
    this.games = this.games.filter(
      (game) => game.player1 !== socket && game.player2 !== socket
    );
    const email = (socket as any)._userEmail.replace(/^"|"$/g, '');
    const id = this.getIdOfUser(email);
    RedisClient.del(`user:${id}:game`); 
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
         
          const player1Email =( (socket as any)._userEmail).replace(/^"|"$/g, '');
          const player2Email =( (this.pendingUser as any)._userEmail).replace(/^"|"$/g, '');
        
          const player1Id = await client.user.findUnique({
            where: {
              email: player1Email,
            },
            select: {
              id: true,
            },
          });
          console.log("player1Id", player1Id);
          console.log("--------------------");
        
          const player2Id = await client.user.findUnique({
            where: {
              email: player2Email,
              
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
          this.countTotalGames += 1;
          console.log(`total number of game running on server is ${this.countTotalGames}`);
          console.log("game initailised");
          console.log(`Publishing game state for game ${game.gameId}`);
          if(game.gameId){
            console.log(`message is ${JSON.stringify(message)}`);
            await RedisPublisher.publish(game.gameId, JSON.stringify({type:"init_game",payload:message.payload,game:game}));
          }
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
          game.makeMove(socket, message.payload);

          console.log(`Publishing game state for game ${game.gameId}`);
          if(game.gameId){
            console.log(`message is ${JSON.stringify(message)}`);
            await RedisPublisher.publish(game.gameId, JSON.stringify({type:"move",payload:message.payload,game:game}));
          }
        }
      }
    
    });
  }

   async addSpectator( socket: WebSocket) {
    console.log(`inside game manager add spectator `)
     socket.on("message", async (data) => {
        const message = JSON.parse(data.toString());
    
        if (message.type === JOIN_SPECTATOR) {
          const gameId = message.payload.gameId;
          console.log("gameId inside join spectator",gameId);
          await webSocketHandler.addSpectator(gameId, socket);
        }
      });
  }
}
