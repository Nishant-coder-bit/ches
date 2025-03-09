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

  private player1Id: any;
  private player2Id: any;
  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.users = [];
  }
  // utility function to get id of user
  async getIdOfUser(email:string){
    email = email.replace(/^"|"$/g, '');
    const user = await client.user.findUnique({
      where: { email: email },
      select: { id: true }
    });

    console.log("inside getIdOfUser",user?.id);
    return user?.id;
  }


  async addUser(socket: WebSocket) {
    console.log("inside add handler")
    this.users.push(socket);    
    const email = (socket as any)._userEmail.replace(/^"|"$/g, '');
    console.log(`User email ${email} inside add User method`);
    const id = await this.getIdOfUser(email);
    
    if (!id) return;

    // // Make sure to track users by their ID
    // this.userSockets[id] = socket;

    const gameId = await RedisClient.get(`user:${id}:game`);
    if (gameId) {
        const gameState = await RedisClient.get(`game:${gameId}`);
        
        if (gameState) {
            const parsedGameState = JSON.parse(gameState);
            const pgnOfGame = await client.game.findUnique({
              where: {
                id: gameId,
              },
              select: {
                moves: true,
                fen:true
              },
           })
            // Determine player color
            const playerColor = parsedGameState.player1Id === id ? "white" : "black";
            const turnFromFe = pgnOfGame?.fen.split(" ")[1] === "w" ? "white" : "black";
            // Send restored state ONLY to the correct user
            socket.send(JSON.stringify({ 
                type: INIT_GAME,
                payload: { 
                    moves:  pgnOfGame?.moves,
                     gameId:gameId,
                     fen: pgnOfGame?.fen
                },
               
                color: turnFromFe
            }));

            // Remove disconnection marker
            await RedisClient.del(`game:${gameId}:player:${id}:disconnected`);
        }
        console.log(`User ${email} reconnected to game ${gameId}`);
      // Re-add participant safely (without overwriting the wrong user)
      await webSocketHandler.addParticipant(gameId, socket);
 
  }
  console.log("before going to game handler")
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
    this.users = this.users.filter((user) => user !== socket);

    if (this.pendingUser === socket) {
       console.log("Player left while waiting for another player to join pending user");
        this.pendingUser = null;
    } 


    // this.games = this.games.filter(
    //   (game) => game.player1 !== socket && game.player2 !== socket
    // );

    const email = (socket as any)._userEmail.replace(/^"|"$/g, '');
    const id = await this.getIdOfUser(email);
    const gameId = await RedisClient.get(`user:${id}:game`);
   
    if(gameId){
      console.log(`User ${email} disconnected from game ${gameId}`);

      //Mark the player as disconnected in Redis
      await RedisClient.set(`game:${gameId}:player:${id}:disconnected`, "true");

       // Set a TTL (time-to-live) so the game doesn’t stay forever
       await RedisClient.expire(`game:${gameId}:player:${id}:disconnected`, 300);

       const game = this.games.find(g => g.gameId === gameId);
       if(game){
        const player1Disconnected = await RedisClient.get(`game:${gameId}:player:${game?.player1Id}:disconnected`);
        const player2Disconnected = await RedisClient.get(`game:${gameId}:player:${game?.player2Id}:disconnected`);
        
        if (player1Disconnected && player2Disconnected) {
          console.log(`Both players disconnected. Cleaning up game ${gameId}`);
          
          // this.games = this.games.filter(g => g.gameId !== gameId);  
       }
    }
  }
}
  
  private addHandler(socket: WebSocket) {
    console.log("inside add handler");
    socket.on("message", async (data) => {

      const message = JSON.parse(data.toString());
      console.log("message",message);
      if (message.type === INIT_GAME) {
        console.log("inside init game");
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
        // console.log(this.users);
        console.log("inside make move")
        console.log("games",this.games);
      
        const email = (socket as any)._userEmail.replace(/^"|"$/g, '');
        const game = this.games.find(
          (game) => (game.player1 as any)._userEmail.replace(/^"|"$/g, '')=== email || (game.player2 as any)._userEmail.replace(/^"|"$/g, '') === email
        );
        console.log(`printing game inside make move ${game}`);
        if (game) {
         
            if ((game.player1 as any)._userEmail.replace(/^"|"$/g, '')=== email) game.player1 = socket;
            if ((game.player2 as any)._userEmail.replace(/^"|"$/g, '') === email) game.player2 = socket;
          
          
          game.makeMove(socket, message.payload);

          console.log(`Publishing game state for game ${game.gameId}`);
          if(game.gameId){
          
            await RedisPublisher.publish(game.gameId, JSON.stringify({type:"move",payload:message.payload,game:game}));
          }
        }
      }

      if (message.type === "reconnect_request") {
         console.log("inside reconnect request");
        const email = (socket as any)._userEmail.replace(/^"|"$/g, "");
        const id = await this.getIdOfUser(email);
        const gameId = await RedisClient.get(`user:${id}:game`);
      
        if (gameId) {
          const gameState = await RedisClient.get(`game:${gameId}`);
            
          if (gameState) {
            const parsedState = JSON.parse(gameState);
            const pgnOfGame = await client.game.findUnique({
              where: {
                id: gameId,
              },
              select: {
                moves: true,
                fen:true
              },
           })
            const playerColor = parsedState.player1Id === id ? "white" : "black";
            const turnFromFe = pgnOfGame?.fen.split(" ")[1] === "w" ? "white" : "black"; 
            // Send restored game state
            socket.send(
              JSON.stringify({
                type: INIT_GAME,
                payload: { moves: pgnOfGame?.moves , fen: pgnOfGame?.fen ,gameId:gameId},
               
                gameId:gameId,
                color: turnFromFe,
              })
            );
    
            // Remove the disconnection marker
            await RedisClient.del(`game:${gameId}:player:${id}:disconnected`);
    
            // Re-add player to WebSocket handler
            await webSocketHandler.addParticipant(gameId, socket);
            return;
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
