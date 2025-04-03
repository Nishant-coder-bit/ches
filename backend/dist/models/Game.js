"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const chess_js_1 = require("chess.js");
const ws_1 = require("ws");
const client_1 = require("@prisma/client");
const RedisClient_1 = __importDefault(require("../utils/RedisClient"));
const prisma = new client_1.PrismaClient();
class Game {
    constructor(gameId, player1Socket, player2Socket, player1Id, player2Id) {
        this.moveCount = 0;
        this.gameId = gameId;
        this.player1Socket = player1Socket;
        this.player2Socket = player2Socket;
        this.player1Id = player1Id;
        this.player2Id = player2Id;
        this.board = new chess_js_1.Chess();
    }
    static create(player1Socket, player2Socket, player1Id, player2Id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create game record in database
            const gameRecord = yield prisma.game.create({
                data: {
                    player1Id,
                    player2Id,
                    status: 'ongoing',
                    moves: '',
                    fen: new chess_js_1.Chess().fen()
                }
            });
            const game = new Game(gameRecord.id, player1Socket, player2Socket, player1Id, player2Id);
            // Initialize game state in Redis
            yield game.saveState();
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
        });
    }
    static restore(gameId, savedState) {
        return __awaiter(this, void 0, void 0, function* () {
            const { player1Id, player2Id, fen, moveCount } = savedState;
            // Create game instance without sockets
            const game = new Game(gameId, null, null, player1Id, player2Id);
            // this.moveCount = moveCount;
            game.board.load(fen);
            return game;
        });
    }
    reconnectPlayer(ws, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (userId === this.player1Id) {
                this.player1Socket = ws;
            }
            else if (userId === this.player2Id) {
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
        });
    }
    makeMove(userId, move) {
        return __awaiter(this, void 0, void 0, function* () {
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
                yield this.saveState();
                // Broadcast move to both players
                this.broadcastGameState(move);
                // Check for game over
                if (this.board.isGameOver()) {
                    yield this.handleGameOver();
                }
            }
            catch (error) {
                throw new Error('Invalid move');
            }
        });
    }
    saveState() {
        return __awaiter(this, void 0, void 0, function* () {
            const gameState = {
                fen: this.board.fen(),
                pgn: this.board.pgn(),
                player1Id: this.player1Id,
                player2Id: this.player2Id,
                moveCount: this.moveCount
            };
            // Save game state in Redis and database ( this will take time to reflect move on screen remove it);
            yield Promise.all([
                RedisClient_1.default.set(`game:${this.gameId}`, JSON.stringify(gameState)),
                RedisClient_1.default.set(`user:${this.player1Id}:game`, this.gameId),
                prisma.game.update({
                    where: { id: this.gameId },
                    data: {
                        moves: this.board.pgn(),
                        fen: this.board.fen()
                    }
                })
            ]);
        });
    }
    broadcastGameState(lastMove) {
        const gameState = {
            type: 'GAME_UPDATE',
            fen: this.board.fen(),
            lastMove,
            moveCount: this.moveCount
        };
        this.sendToPlayer(this.player1Socket, gameState);
        this.sendToPlayer(this.player2Socket, gameState);
    }
    handleGameOver() {
        return __awaiter(this, void 0, void 0, function* () {
            const winner = this.board.turn() === 'w' ? 'black' : 'white';
            const gameOverState = {
                type: 'GAME_OVER',
                winner,
                fen: this.board.fen()
            };
            this.sendToPlayer(this.player1Socket, gameOverState);
            this.sendToPlayer(this.player2Socket, gameOverState);
            yield prisma.game.update({
                where: { id: this.gameId },
                data: { status: 'finished' }
            });
        });
    }
    sendToPlayer(ws, data) {
        if (ws && ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }
}
exports.Game = Game;
