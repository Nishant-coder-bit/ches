import { Chess } from "chess.js";
import { WebSocket } from "ws";
import { PrismaClient, User } from "@prisma/client";
import RedisClient from "../utils/RedisClient";
import { GAME_OVER, INIT_GAME, INVALID_MOVE, MOVE } from "../utils/Message";
const client = new PrismaClient();
export class Game {
  public player1: WebSocket;
  public player2: WebSocket;
  private board: Chess;
  private startTime: Date;
  private moveCount: number;
  public gameId: string | undefined;
  private player1Id:any;
  private player2Id: any;
  constructor(player1: WebSocket, player2: WebSocket) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTime = new Date();
    this.moveCount = 0;
  }
  public static async create(
    player1: WebSocket,
    player2: WebSocket,
    player1Id: any,
    player2Id: any
  ): Promise<Game> {
   
    const game = new Game(player1, player2);
    await game.initializeGameData(player1Id, player2Id);
    // game.initializeGame();
    return game;
  }
  private async initializeGameData(player1Id: any, player2Id: any) {
    try {
      this.player1Id = player1Id;
      this.player2Id = player2Id;
      console.log("inside Game Class constructor") 
      const game = await client.game.create({
        data: {

          player1Id: player1Id,
          player2Id: player2Id,
          moves: this.board.pgn(), // `this.board` is now initialized.
          fen: this.board.fen(),
        },
      });
      console.log(`Game is created between ${player1Id}  and ${player2Id}`, game);
      this.gameId = game.id;
      this.initializeGame(player1Id, player2Id,game.id);
    } catch (error) {
      console.error("Error initializing game data:", error);
    }
  }
  private initializeGame(player1Id: number, player2Id: number,gameId:string) {
    this.player1.send(JSON.stringify({ type: INIT_GAME, color: "white" }));
    this.player2.send(JSON.stringify({ type: INIT_GAME, color: "black" }));
    console.log("inside initialize game method")
    RedisClient.set(`game:${this.gameId}`, JSON.stringify(this.board.fen()));
    RedisClient.set(`user:${player1Id}:game`, gameId);
    RedisClient.set(`user:${player2Id}:game`, gameId);
  }
  public async makeMove(
    socket: WebSocket,
    move: {
      from: string;
      to: string;
    }
  ) {
    if (this.gameId) {
      await client.game.update({
        where:{
          id:this.gameId
        },
        data:{
          status:"ongoing"
        }
      })
      await RedisClient.set(`game:${this.gameId}`, JSON.stringify({
        fen: this.board.fen(),
        moves: this.board.pgn(),
      })); // Update game state in Redis
    }
    //validate type of move using zod
    if (this.moveCount % 2 === 0 && socket != this.player1) {
      console.log("early return");
      return;
    }
    if (this.moveCount % 2 === 1 && socket != this.player2) {
      console.log("early return");
      return;
    }
    try {
      console.log("------------------");
      console.log("move",move);
      this.board.move(move); 
      this.broadcastMove(move);
      const winner = this.board.turn() === "w" ? this.player1Id :this.player2Id;
      //push move to redis queue
      await RedisClient.rpush(
        `game:${this.gameId}:queue`,
        JSON.stringify({ move, fen: this.board.fen(), pgn: this.board.pgn(),isGameOver:this.board.isGameOver(),winner:winner })
      );
    } catch (e) {
      console.log("Invalid Move", e);
      socket.send(JSON.stringify({
        type:'invalid_move',
        payload:{
            move:move
        }
      }))
      return;
    }
    if (this.board.isGameOver()) {
      this.handleGameOver();
    }

    this.moveCount++;
  }

  private handleGameOver() { 
     // need to save the winner in the database of the game 
    
     if(this.gameId){
        const winner = this.board.turn() === "w" ? "black" : "white";
        RedisClient.set(`game:${this.gameId}:winner`, winner);
     }
    this.player1.send(
      JSON.stringify({
        type: GAME_OVER,
        payload: {
          winner: this.board.turn() === "w" ? "black" : "white",
        },
      })
    );
    console.log("message sent to player1");
    this.player2.send(
      JSON.stringify({
        type: GAME_OVER,
        payload: {
          winner: this.board.turn() === "w" ? "black" : "white",
        },
      })
    );
    console.log("message sent to player2");
  }
  private broadcastMove(move: { from: string; to: string }) {
    if (this.moveCount % 2 === 0) {
      this.player2.send(
        JSON.stringify({
          type: MOVE,
          payload: move,
        })
      );
      console.log("message sent to player2");
    } else {
      this.player1.send(
        JSON.stringify({
          type: MOVE,
          payload: move,
        })
      );
      console.log("message sent to player1");
    }
  }
}
