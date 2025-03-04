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
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }
    addUser(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            this.users.push(socket);
            const email = socket._userEmail;
            console.log("inside add user", email);
            // const gameId = await RedisClient.get(`user:${email}:game`); // Check if user has an active game
            // if (gameId) {
            //   const gameState = await RedisClient.get(`game:${gameId}`);
            //   if (gameState) {
            //     socket.send(JSON.stringify({ type: INIT_GAME, payload: JSON.parse(gameState) })); // Send restored state
            //   }
            // }
            // console.log("gameId",gameId);
            // await this.recoverGames(socket);
            this.addHandler(socket);
        });
    }
    // async recoverGames(socket: WebSocket) {
    //   const gameId = await this.getGameId(socket);
    //   if (gameId) {
    //     await webSocketHandler.recoverParticipants(gameId, this.users);
    //   }
    // }
    // private getGameId(socket: WebSocket): string | undefined {
    //   const game = this.games.find(
    //     (game) => game.player1 === socket || game.player2 === socket
    //   );
    //   return game ? game.gameId : undefined;
    // }
    removeUser(socket) {
        const user = this.users.filter((user) => user !== socket);
        if (this.pendingUser === socket) {
            this.pendingUser = null;
        }
        this.games = this.games.filter((game) => game.player1 !== socket && game.player2 !== socket);
        //remove the user
        const email = socket._userEmail;
        RedisClient_1.default.del(`user:${email}:game`);
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
                    console.log("this.pendingUser", this.pendingUser);
                    console.log("socket", socket._userEmail);
                    console.log("(socket as any)._userEmail", socket._userEmail);
                    console.log("(this.pendingUser as any)._userEmail", this.pendingUser._userEmail);
                    const player1Email = (socket._userEmail).replace(/^"|"$/g, '');
                    ;
                    const player2Email = (this.pendingUser._userEmail).replace(/^"|"$/g, '');
                    ;
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
            // if (message.type === JOIN_SPECTATOR) {
            //   const gameId = message.payload.gameId;
            //   await this.addSpectator(gameId, socket);
            // }
        }));
    }
}
exports.GameManager = GameManager;
