"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const Message_1 = require("./Message");
const Game_1 = require("./Game");
class GameManager {
    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }
    addUser(socket) {
        this.users.push(socket);
        this.addHandler(socket);
    }
    removeUser(socket) {
        const user = this.users.find((user) => user === socket);
        //remove the user
    }
    addHandler(socket) {
        socket.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === Message_1.INIT_GAME) {
                if (this.pendingUser) {
                    console.log(this.pendingUser);
                    //start the game
                    const game = new Game_1.Game(this.pendingUser, socket);
                    this.games.push(game);
                    console.log("game initailised");
                    this.pendingUser = null;
                }
                else {
                    this.pendingUser = socket;
                }
            }
            if (message.type === Message_1.MOVE) {
                // console.log(this.users);
                // console.log(socket);
                const game = this.games.find((game) => game.player1 === socket || game.player2 === socket);
                if (game) {
                    console.log("inside game");
                    game.makeMove(socket, message.payload);
                }
            }
        });
    }
}
exports.GameManager = GameManager;
