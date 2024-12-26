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
    game.initializeGame();
    return game;
  }
  private async initializeGameData(player1Id: number, player2Id: number) {
    try {
      console.log(4);
      const game = await client.game.create({
        data: {

          player1Id: player1Id,
          player2Id: player2Id,
          moves: this.board.pgn(), // `this.board` is now initialized.
          fen: this.board.fen(),
        },
      });
      console.log(5);
      console.log("game", game);
      this.gameId = game.id;
      this.initializeGame();
    } catch (error) {
      console.error("Error initializing game data:", error);
    }
  }
  private initializeGame() {
    this.player1.send(JSON.stringify({ type: INIT_GAME, color: "white" }));
    this.player2.send(JSON.stringify({ type: INIT_GAME, color: "black" }));
    console.log(6);
    RedisClient.set(`game:${this.gameId}`, JSON.stringify(this.board.fen()));
    console.log(7);
  }
  public async makeMove(
    socket: WebSocket,
    move: {
      from: string;
      to: string;
    }
  ) {
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

      //push move to redis queue
      await RedisClient.rpush(
        `game:${this.gameId}:queue`,
        JSON.stringify({ move, fen: this.board.fen(), pgn: this.board.pgn() })
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
