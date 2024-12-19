"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const chess_js_1 = require("chess.js");
const Message_1 = require("./Message");
class Game {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = new chess_js_1.Chess();
        this.startTime = new Date();
        this.moveCount = 0;
        this.player1.send(JSON.stringify({
            type: Message_1.INIT_GAME,
            color: "white"
        }));
        this.player2.send(JSON.stringify({
            type: Message_1.INIT_GAME,
            color: "black"
        }));
    }
    makeMove(socket, move) {
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
        }
        catch (e) {
            console.log("Invalid MOve", e);
            return;
        }
        if (this.board.isGameOver()) {
            this.player1.send(JSON.stringify({
                type: Message_1.GAME_OVER,
                payload: {
                    winner: this.board.turn() === 'w' ? "black" : "white"
                }
            }));
            console.log("message sent to player1");
            this.player2.send(JSON.stringify({
                type: Message_1.GAME_OVER,
                payload: {
                    winner: this.board.turn() === 'w' ? "black" : "white"
                }
            }));
            console.log("message sent to player2");
        }
        if (this.moveCount % 2 === 0) {
            this.player2.send(JSON.stringify({
                type: Message_1.MOVE,
                payload: move
            }));
            console.log("message sent to player2");
        }
        else {
            this.player1.send(JSON.stringify({
                type: Message_1.MOVE,
                payload: move
            }));
            console.log("message sent to player1");
        }
        this.moveCount++;
    }
}
exports.Game = Game;
