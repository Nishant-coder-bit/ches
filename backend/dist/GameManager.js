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
exports.GameManager = void 0;
const Message_1 = require("./utils/Message");
const client_1 = require("@prisma/client");
const Game_1 = require("./models/Game");
const WebSocketHandler_1 = require("./utils/WebSocketHandler");
const RedisClient_1 = __importDefault(require("./utils/RedisClient"));
const client = new client_1.PrismaClient();
const webSocketHandler = new WebSocketHandler_1.WebSocketHandler();
class GameManager {
    constructor() {
        this.countTotalGames = 0;
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }
    // utility function to get id of user
    getIdOfUser(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield client.user.findUnique({
                where: { email: email },
                select: { id: true }
            });
            console.log("inside getIdOfUser", user === null || user === void 0 ? void 0 : user.id);
            return user === null || user === void 0 ? void 0 : user.id;
        });
    }
    addUser(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            this.users.push(socket);
            const email = socket._userEmail.replace(/^"|"$/g, '');
            console.log("inside add user", email);
            const id = this.getIdOfUser(email);
            console.log(`id of user is ${id}`);
            const gameId = yield RedisClient_1.default.get(`user:${id}:game`); // Check if user has an active game
            console.log("gameId from redis client", gameId);
            if (gameId) {
                const gameState = yield RedisClient_1.default.get(`game:${gameId}`);
                console.log(`gameState from redis client is ${gameState}`);
                if (gameState) {
                    // Send restored state to user
                    socket.send(JSON.stringify({ type: Message_1.INIT_GAME, payload: JSON.parse(gameState) }));
                }
                const recoveredPromise = yield this.recoverGames(gameId);
                console.log(`recovered promise is ${recoveredPromise}`);
                const value = yield recoveredPromise.resolve();
                console.log(`value is ${value}`);
                if (value.done === true) {
                    console.log("game recovered");
                    return;
                }
            }
            this.addHandler(socket);
        });
    }
    recoverGames(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("inside recover games");
            if (gameId) {
                const returnedPromise = yield webSocketHandler.recoverParticipants(gameId, this.users);
                const value = yield returnedPromise.resolve();
                console.log("value", value);
                if (value.done === true) {
                    console.log("game recovered");
                    return new Promise((resolve, reject) => {
                        resolve(value);
                    });
                }
            }
            return new Promise((resolve, reject) => {
                resolve({ done: false });
            });
        });
    }
    removeUser(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("inside remove user");
            const user = this.users.filter((user) => user !== socket);
            if (this.pendingUser === socket) {
                this.pendingUser = null;
            }
            this.games = this.games.filter((game) => game.player1 !== socket && game.player2 !== socket);
            const email = socket._userEmail.replace(/^"|"$/g, '');
            const id = this.getIdOfUser(email);
            RedisClient_1.default.del(`user:${id}:game`);
        });
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
                    const player1Email = (socket._userEmail).replace(/^"|"$/g, '');
                    const player2Email = (this.pendingUser._userEmail).replace(/^"|"$/g, '');
                    const player1Id = yield client.user.findUnique({
                        where: {
                            email: player1Email,
                        },
                        select: {
                            id: true,
                        },
                    });
                    console.log("player1Id", player1Id);
                    console.log("--------------------");
                    const player2Id = yield client.user.findUnique({
                        where: {
                            email: player2Email,
                        },
                        select: {
                            id: true,
                        },
                    });
                    console.log("player2Id", player2Id);
                    const game = yield Game_1.Game.create(this.pendingUser, socket, player1Id === null || player1Id === void 0 ? void 0 : player1Id.id, player2Id === null || player2Id === void 0 ? void 0 : player2Id.id);
                    this.games.push(game);
                    console.log(`game id is ${game.gameId} and going inside addParticipant`);
                    yield webSocketHandler.addParticipant, (game.gameId, this.pendingUser);
                    yield webSocketHandler.addParticipant(game.gameId, socket);
                    this.countTotalGames += 1;
                    console.log(`total number of game running on server is ${this.countTotalGames}`);
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
            // if (message.type === JOIN_SPECTATOR) {
            //   const gameId = message.payload.gameId;
            //   await this.addSpectator(gameId, socket);
            // }
        }));
    }
}
exports.GameManager = GameManager;
