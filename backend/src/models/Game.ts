import { Chess } from "chess.js";
import { WebSocket } from "ws";
import { PrismaClient } from "@prisma/client";
import RedisClient from "../utils/RedisClient";

const prisma = new PrismaClient();

export class Game {
  public gameId: string;
  private board: Chess;
  private player1Socket: WebSocket;
  private player2Socket: WebSocket;
  private player1Id: string;
  private player2Id: string;
  public moveCount: number = 0;

  private constructor(
    gameId: string,
    player1Socket: WebSocket,
    player2Socket: WebSocket,
    player1Id: string,
    player2Id: string
  ) {
    this.gameId = gameId;
    this.player1Socket = player1Socket;
    this.player2Socket = player2Socket;
    this.player1Id = player1Id;
    this.player2Id = player2Id;
    this.board = new Chess();
  }

  static async create(
    player1Socket: WebSocket,
    player2Socket: WebSocket,
    player1Id: string,
    player2Id: string
  ): Promise<Game> {
    // Create game record in database
    const gameRecord = await prisma.game.create({
      data: {
        player1Id,
        player2Id,
        status: 'CREATED',
        moves: '',
        fen: new Chess().fen(),
      
      }
    });

    const game = new Game(
      gameRecord.id,
      player1Socket,
      player2Socket,
      player1Id,
      player2Id
    );

    // Initialize game state in Redis
    await game.saveState("STARTED",60*10);
     // Schedule game completion
    game.scheduleGameCompletion(game.gameId,60*10);
    // Send initial game state to both players
    game.sendToPlayer(player1Socket, {
      type: 'GAME_START',
      color: 'white',
      gameId: game.gameId,
      fen: game.board.fen()
    });

    game.sendToPlayer(player2Socket, {
      type: 'GAME_START',
      color: 'black',
      gameId: game.gameId,
      fen: game.board.fen()
    });

    return game;
  }

  static async restore(gameId: string, savedState: any): Promise<any> {
    const { player1Id, player2Id, fen,moveCount } = savedState;
  
    // Create game instance without sockets
    const game = new Game(
      gameId,
      null as unknown as WebSocket,
      null as unknown as WebSocket,
      player1Id,
      player2Id,
    );
    game.moveCount = moveCount;
    game.board.load(fen);
    return game;
  }

  async reconnectPlayer(ws: WebSocket, userId: string) {
    if (userId === this.player1Id) {
      this.player1Socket = ws;
    } else if (userId === this.player2Id) {
      this.player2Socket = ws;
    }

    // Send current game state to reconnected player
    this.sendToPlayer(ws, {
      type: 'GAME_RESTORED',
      color: userId === this.player1Id ? 'white' : 'black',
      gameId: this.gameId,
      fen: this.board.fen(),
      moves: this.board.pgn()
    });
  }

  async makeMove(userId: string, move: { from: string; to: string }) {
    // Verify it's the player's turn
    const isWhiteTurn = this.moveCount % 2 === 0;
    if ((isWhiteTurn && userId !== this.player1Id) || 
        (!isWhiteTurn && userId !== this.player2Id)) {
      throw new Error('Not your turn');
    }

    try {
      this.board.move(move);
      this.moveCount++;
      
      // Save game state
      await this.saveState("ongoing",60*10,true);
      
      // Broadcast move to both players
      this.broadcastGameState(move);
      
      // Check for game over
      if (this.board.isGameOver()) {
        await this.handleGameOver();
      }
    } catch (error) {
      throw new Error('Invalid move');
    }
  }

  private async saveState(status?:string,TIMETOLIVE?:number,isMove?:boolean) {
    const gameState = {
      fen: this.board.fen(),
      pgn: this.board.pgn(),
      player1Id: this.player1Id,
      player2Id: this.player2Id,
      moveCount: this.moveCount
    };
    if(isMove){
      await RedisClient.set(`game:${this.gameId}`, JSON.stringify(gameState),24*60*60);
     await prisma.game.update({
      where: { id: this.gameId },
      data: {
        moves: this.board.pgn(),
        fen: this.board.fen(),
        status: status || 'ONGOING'
      }
    });
    // return; 
    }
    // Save game state in Redis and database ( this will take time to reflect move on screen remove it);
  else{
    await Promise.all([
      
      RedisClient.set(`game:${this.gameId}`, JSON.stringify(gameState),24*60*60),
      RedisClient.set( `user:${this.player2Id}:game`, this.gameId, TIMETOLIVE),
      RedisClient.set( `user:${this.player1Id}:game`, this.gameId, TIMETOLIVE),
      prisma.game.update({
        where: { id: this.gameId },
        data: {
          moves: this.board.pgn(),
          fen: this.board.fen(),
          status: status || 'ONGOING'
        }
      })
    ]);
  }
  }

  private broadcastGameState(lastMove?: { from: string; to: string }) {
    const gameState = {
      type: 'GAME_UPDATE',
      fen: this.board.fen(),
      lastMove,
      moveCount: this.moveCount
    };

    this.sendToPlayer(this.player1Socket, gameState);
    this.sendToPlayer(this.player2Socket, gameState);
  }

  private async handleGameOver() {
    const winner = this.board.turn() === 'w' ? 'black' : 'white';
    
    const gameOverState = {
      type: 'GAME_OVER',
      winner,
      fen: this.board.fen(),
      status: 'COMPLETED',
    };


    this.handleDeleteGameKeysAndUpdateState(this.gameId);

    this.sendToPlayer(this.player1Socket, gameOverState);
    this.sendToPlayer(this.player2Socket, gameOverState);

  }
  private async handleDeleteGameKeysAndUpdateState(gameId:string) {
    const game = await RedisClient.get(`game:${gameId}`);
    if (game) {
        let gameData = JSON.parse(game);
            //db call 
            await prisma.game.update({
                where: { id: gameId },
                data: { status: 'COMPLETED' }
            });
            await RedisClient.del(`game:${gameId}`); 
            await RedisClient.del(`user:${gameData.player1Id}:game`);
            await RedisClient.del(`user:${gameData.player2Id}:game`);
            this.player1Socket.send(JSON.stringify({ type: 'GAME_COMPLETED',message: 'Game completed' }));
            this.player2Socket.send(JSON.stringify({ type: 'GAME_COMPLETED',message: 'Game completed' }));
            console.log(`Game ${gameId} auto-completed due to timeout.`);
    } 
  }

  private sendToPlayer(ws: WebSocket, data: any) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }else{
      // Handle case where WebSocket is not open
      // start timer to check if socket is open 
      // and then make the second player winner based on gamewinning condition
    }
  }

   async  scheduleGameCompletion(gameId:any,ttl:any) {
    setTimeout(async () => {
        const game = await RedisClient.get(`game:${gameId}`);
        if (game) {
           this.handleDeleteGameKeysAndUpdateState(gameId);
        }
    }, ttl * 1000); // Convert to milliseconds
  }
}