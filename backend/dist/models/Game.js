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
            game.initializeGame();
            return game;
        });
    }
    initializeGameData(player1Id, player2Id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(4);
                const game = yield client.game.create({
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
            }
            catch (error) {
                console.error("Error initializing game data:", error);
            }
        });
    }
    initializeGame() {
        this.player1.send(JSON.stringify({ type: "INIT_GAME", color: "white" }));
        this.player2.send(JSON.stringify({ type: "INIT_GAME", color: "black" }));
        console.log(6);
        RedisClient_1.default.set(`game:${this.gameId}`, JSON.stringify(this.board.fen()));
        console.log(7);
    }
    makeMove(socket, move) {
        return __awaiter(this, void 0, void 0, function* () {
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
                console.log("move", move);
                this.board.move(move);
                this.broadcastMove(move);
                //push move to redis queue
                yield RedisClient_1.default.rpush(`game:${this.gameId}:queue`, JSON.stringify({ move, fen: this.board.fen(), pgn: this.board.pgn() }));
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
    }
    broadcastMove(move) {
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
