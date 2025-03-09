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
const client_1 = require("@prisma/client");
const RedisClient_1 = __importDefault(require("../utils/RedisClient"));
const Message_1 = require("../utils/Message");
const client = new client_1.PrismaClient();
class Game {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = new chess_js_1.Chess();
        this.startTime = new Date();
        this.moveCount = 0;
    }
    static create(player1, player2, player1Id, player2Id) {
        return __awaiter(this, void 0, void 0, function* () {
            const game = new Game(player1, player2);
            yield game.initializeGameData(player1Id, player2Id);
            // game.initializeGame();
            return game;
        });
    }
    initializeGameData(player1Id, player2Id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.player1Id = player1Id;
                this.player2Id = player2Id;
                const game = yield client.game.create({
                    data: {
                        player1Id: player1Id,
                        player2Id: player2Id,
                        moves: this.board.pgn(), // `this.board` is now initialized.
                        fen: this.board.fen(),
                        status: Message_1.GAME_STATUS_ONGOING
                    },
                });
                console.log(`Game is created between ${player1Id}  and ${player2Id}`, game);
                this.gameId = game.id;
                this.initializeGame(player1Id, player2Id, game.id);
            }
            catch (error) {
                console.error("Error initializing game data:", error);
            }
        });
    }
    initializeGame(player1Id, player2Id, gameId) {
        this.player1.send(JSON.stringify({ type: Message_1.INIT_GAME, color: "white", gameId: gameId, playerId: player1Id }));
        this.player2.send(JSON.stringify({ type: Message_1.INIT_GAME, color: "black", gameId: gameId, playerId: player2Id }));
        console.log(`inside initialize game and gameId is ${gameId} and player1Id is ${player1Id} and player2Id is ${player2Id}`);
        RedisClient_1.default.set(`game:${this.gameId}`, JSON.stringify({
            fen: this.board.fen(),
            player1Id: this.player1Id,
            player2Id: this.player2Id,
        }));
        RedisClient_1.default.set(`user:${player1Id}:game`, gameId);
        RedisClient_1.default.set(`user:${player2Id}:game`, gameId);
    }
    makeMove(socket, move) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.gameId) {
                yield client.game.update({
                    where: {
                        id: this.gameId
                    },
                    data: {
                        status: "ongoing"
                    }
                });
                yield RedisClient_1.default.set(`game:${this.gameId}`, JSON.stringify({
                    fen: this.board.fen(),
                    moves: this.board.pgn(),
                    player1Id: this.player1Id,
                    player2Id: this.player2Id,
                })); // Update game state in Redis
            }
            const email = socket._userEmail.replace(/^"|"$/g, '');
            console.log(`User email ${email} inside makeMove method`);
            //validate type of move using zod
            if (this.moveCount % 2 === 0 && email != this.player1._userEmail.replace(/^"|"$/g, '')) {
                console.log("early return");
                return;
            }
            if (this.moveCount % 2 === 1 && email != this.player2._userEmail.replace(/^"|"$/g, '')) {
                console.log("early return");
                return;
            }
            try {
                console.log(`making move ${move} for player ${this.board.turn()}`);
                this.board.move(move);
                this.broadcastMove(move);
                const winner = this.board.turn() === "w" ? this.player1Id : this.player2Id;
                //push move to redis queue
                const moveData = JSON.stringify({
                    move: move,
                    fen: this.board.fen(),
                    pgn: this.board.pgn(),
                    isGameOver: this.board.isGameOver(),
                    winner: winner
                });
                console.log("Pushing to Redis:", moveData);
                yield RedisClient_1.default.rpush(`game:${this.gameId}:queue`, moveData);
                yield new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (e) {
                console.log("Invalid Move", e);
                socket.send(JSON.stringify({
                    type: 'invalid_move',
                    payload: {
                        move: move
                    }
                }));
                return;
            }
            if (this.board.isGameOver()) {
                this.handleGameOver();
            }
            this.moveCount++;
        });
    }
    handleGameOver() {
        return __awaiter(this, void 0, void 0, function* () {
            // need to save the winner in the database of the game 
            if (this.gameId) {
                const winner = this.board.turn() === "w" ? "black" : "white";
                yield client.game.update({
                    where: {
                        id: this.gameId
                    },
                    data: {
                        status: "finished",
                    }
                });
                RedisClient_1.default.set(`game:${this.gameId}:winner`, winner);
            }
            this.player1.send(JSON.stringify({
                type: Message_1.GAME_OVER,
                payload: {
                    winner: this.board.turn() === "w" ? "black" : "white",
                },
            }));
            console.log("message sent to player1");
            this.player2.send(JSON.stringify({
                type: Message_1.GAME_OVER,
                payload: {
                    winner: this.board.turn() === "w" ? "black" : "white",
                },
            }));
            console.log("message sent to player2");
        });
    }
    broadcastMove(move) {
        console.log("broadcasting move", move);
        if (this.moveCount % 2 === 0) {
            this.player2.send(JSON.stringify({
                type: Message_1.MOVE,
                payload: move,
            }));
            console.log("message sent to player2");
        }
        else {
            this.player1.send(JSON.stringify({
                type: Message_1.MOVE,
                payload: move,
            }));
            console.log("message sent to player1");
        }
    }
}
exports.Game = Game;
