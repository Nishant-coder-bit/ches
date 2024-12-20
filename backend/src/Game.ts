import { Chess } from "chess.js";
import { WebSocket } from "ws";
import { GAME_OVER, INIT_GAME, MOVE } from "./Message";
import { PrismaClient, User } from "@prisma/client";
const client = new PrismaClient();
export class Game {
  public player1: WebSocket;
  public player2: WebSocket;
  private board: Chess;
  private startTime: Date;
  private moveCount: number;
  private gameId: string|undefined;
  constructor(player1: WebSocket, player2: WebSocket,player1Id:any,player2Id:any) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTime = new Date();
    this.moveCount = 0;
     this.initializeGameData(player1Id,player2Id);
  }

  private async initializeGameData(player1Id: number, player2Id: number) {
    try {
        const game = await client.game.create({
            data: {
                player1Id: player1Id,
                player2Id: player2Id,
                moves: this.board.pgn(), // `this.board` is now initialized.
                fen: this.board.fen(),
            },
        });
        this.gameId = game.id;
        this.initializeGame();
    } catch (error) {
        console.error("Error initializing game data:", error);
    }
}
  private initializeGame() {
    this.player1.send(JSON.stringify({ type: "INIT_GAME", color: "white" }));
    this.player2.send(JSON.stringify({ type: "INIT_GAME", color: "black" }));
  }
  public makeMove(
    socket: WebSocket,
    move: {
      from: string;
      to: string;
    }
  ) {
    console.log("inside make move");

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
      this.board.move(move);
      console.log("move succedded");
    } catch (e) {
      console.log("Invalid MOve", e);
      return;
    }
    if (this.board.isGameOver()) {
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
    this.moveCount++;
  }
}
