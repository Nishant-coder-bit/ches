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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const Message_1 = require("./utils/Message");
const client_1 = require("@prisma/client");
const Game_1 = require("./models/Game");
const WebSocketHandler_1 = require("./utils/WebSocketHandler");
const client = new client_1.PrismaClient();
const webSocketHandler = new WebSocketHandler_1.WebSocketHandler();
class GameManager {
    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }
    addUser(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            this.users.push(socket);
            yield this.recoverGames(socket);
            this.addHandler(socket);
        });
    }
    recoverGames(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            const gameId = yield this.getGameId(socket);
            if (gameId) {
                yield webSocketHandler.recoverParticipants(gameId, this.users);
            }
        });
    }
    getGameId(socket) {
        const game = this.games.find((game) => game.player1 === socket || game.player2 === socket);
        return game ? game.gameId : undefined;
    }
    removeUser(socket) {
        const user = this.users.filter((user) => user !== socket);
        if (this.pendingUser === socket) {
            this.pendingUser = null;
        }
        this.games = this.games.filter((game) => game.player1 !== socket && game.player2 !== socket);
        //remove the user
    }
    addHandler(socket) {
        socket.on("message", (data) => __awaiter(this, void 0, void 0, function* () {
            const message = JSON.parse(data.toString());
            if (message.type === Message_1.INIT_GAME) {
                if (this.pendingUser === socket) {
                    console.log("try playing with new player , this is not allowed");
                }
                else if (this.pendingUser) {
                    //start the game
                    console.log("(socket as any)._userEmail", socket._userEmail);
                    console.log("(this.pendingUser as any)._userEmail", this.pendingUser._userEmail);
                    const player1Id = yield client.user.findUnique({
                        where: {
                            email: socket._userEmail,
                        },
                        select: {
                            id: true,
                        },
                    });
                    console.log("player1Id", player1Id);
                    console.log("--------------------");
                    const player2Id = yield client.user.findUnique({
                        where: {
                            email: this.pendingUser._userEmail,
                        },
                        select: {
                            id: true,
                        },
                    });
                    console.log("player2Id", player2Id);
                    const game = yield Game_1.Game.create(this.pendingUser, socket, player1Id === null || player1Id === void 0 ? void 0 : player1Id.id, player2Id === null || player2Id === void 0 ? void 0 : player2Id.id);
                    this.games.push(game);
                    yield webSocketHandler.addParticipant, (game.gameId, this.pendingUser);
                    yield webSocketHandler.addParticipant(game.gameId, socket);
                    console.log("game initailised");
                    this.pendingUser = null;
                }
                else {
                    this.pendingUser = socket;
                    console.log("Waiting for another player...");
                }
            }
            if (message.type === Message_1.MOVE) {
                console.log(this.users);
                // console.log(socket);
                const game = this.games.find((game) => game.player1 === socket || game.player2 === socket);
                if (game) {
                    console.log("inside game");
                    console.log("----------------------");
                    console.log("game inside move ", game);
                    game.makeMove(socket, message.payload);
                }
            }
            if (message.type === Message_1.JOIN_SPECTATOR) {
                const gameId = message.payload.gameId;
                yield this.addSpectator(gameId, socket);
            }
        }));
    }
    addSpectator(gameId, socket) {
        return __awaiter(this, void 0, void 0, function* () {
            yield webSocketHandler.addSpectator(gameId, socket);
        });
    }
}
exports.GameManager = GameManager;
