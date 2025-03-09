"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const RedisClient_1 = __importStar(require("./utils/RedisClient"));
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
            email = email.replace(/^"|"$/g, '');
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
            console.log("inside add handler");
            this.users.push(socket);
            const email = socket._userEmail.replace(/^"|"$/g, '');
            console.log(`User email ${email} inside add User method`);
            const id = yield this.getIdOfUser(email);
            if (!id)
                return;
            // // Make sure to track users by their ID
            // this.userSockets[id] = socket;
            const gameId = yield RedisClient_1.default.get(`user:${id}:game`);
            if (gameId) {
                const gameState = yield RedisClient_1.default.get(`game:${gameId}`);
                if (gameState) {
                    const parsedGameState = JSON.parse(gameState);
                    const pgnOfGame = yield client.game.findUnique({
                        where: {
                            id: gameId,
                        },
                        select: {
                            moves: true,
                            fen: true
                        },
                    });
                    // Determine player color
                    const playerColor = parsedGameState.player1Id === id ? "white" : "black";
                    const turnFromFe = (pgnOfGame === null || pgnOfGame === void 0 ? void 0 : pgnOfGame.fen.split(" ")[1]) === "w" ? "white" : "black";
                    // Send restored state ONLY to the correct user
                    socket.send(JSON.stringify({
                        type: Message_1.INIT_GAME,
                        payload: {
                            moves: pgnOfGame === null || pgnOfGame === void 0 ? void 0 : pgnOfGame.moves,
                            gameId: gameId,
                            fen: pgnOfGame === null || pgnOfGame === void 0 ? void 0 : pgnOfGame.fen
                        },
                        color: turnFromFe
                    }));
                    // Remove disconnection marker
                    yield RedisClient_1.default.del(`game:${gameId}:player:${id}:disconnected`);
                }
                console.log(`User ${email} reconnected to game ${gameId}`);
                // Re-add participant safely (without overwriting the wrong user)
                yield webSocketHandler.addParticipant(gameId, socket);
            }
            console.log("before going to game handler");
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
            this.users = this.users.filter((user) => user !== socket);
            if (this.pendingUser === socket) {
                console.log("Player left while waiting for another player to join pending user");
                this.pendingUser = null;
            }
            // this.games = this.games.filter(
            //   (game) => game.player1 !== socket && game.player2 !== socket
            // );
            const email = socket._userEmail.replace(/^"|"$/g, '');
            const id = yield this.getIdOfUser(email);
            const gameId = yield RedisClient_1.default.get(`user:${id}:game`);
            if (gameId) {
                console.log(`User ${email} disconnected from game ${gameId}`);
                //Mark the player as disconnected in Redis
                yield RedisClient_1.default.set(`game:${gameId}:player:${id}:disconnected`, "true");
                // Set a TTL (time-to-live) so the game doesn’t stay forever
                yield RedisClient_1.default.expire(`game:${gameId}:player:${id}:disconnected`, 300);
                const game = this.games.find(g => g.gameId === gameId);
                if (game) {
                    const player1Disconnected = yield RedisClient_1.default.get(`game:${gameId}:player:${game === null || game === void 0 ? void 0 : game.player1Id}:disconnected`);
                    const player2Disconnected = yield RedisClient_1.default.get(`game:${gameId}:player:${game === null || game === void 0 ? void 0 : game.player2Id}:disconnected`);
                    if (player1Disconnected && player2Disconnected) {
                        console.log(`Both players disconnected. Cleaning up game ${gameId}`);
                        // this.games = this.games.filter(g => g.gameId !== gameId);  
                    }
                }
            }
        });
    }
    addHandler(socket) {
        console.log("inside add handler");
        socket.on("message", (data) => __awaiter(this, void 0, void 0, function* () {
            const message = JSON.parse(data.toString());
            console.log("message", message);
            if (message.type === Message_1.INIT_GAME) {
                console.log("inside init game");
                if (this.pendingUser === socket) {
                    console.log("try playing with new player , this is not allowed");
                }
                else if (this.pendingUser) {
                    //start the game
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
                    yield webSocketHandler.addParticipant, (game.gameId, this.pendingUser);
                    yield webSocketHandler.addParticipant(game.gameId, socket);
                    this.countTotalGames += 1;
                    console.log(`total number of game running on server is ${this.countTotalGames}`);
                    console.log("game initailised");
                    console.log(`Publishing game state for game ${game.gameId}`);
                    if (game.gameId) {
                        console.log(`message is ${JSON.stringify(message)}`);
                        yield RedisClient_1.RedisPublisher.publish(game.gameId, JSON.stringify({ type: "init_game", payload: message.payload, game: game }));
                    }
                    this.pendingUser = null;
                }
                else {
                    this.pendingUser = socket;
                    console.log("Waiting for another player...");
                }
            }
            if (message.type === Message_1.MOVE) {
                // console.log(this.users);
                console.log("inside make move");
                console.log("games", this.games);
                const email = socket._userEmail.replace(/^"|"$/g, '');
                const game = this.games.find((game) => game.player1._userEmail.replace(/^"|"$/g, '') === email || game.player2._userEmail.replace(/^"|"$/g, '') === email);
                console.log(`printing game inside make move ${game}`);
                if (game) {
                    if (game.player1._userEmail.replace(/^"|"$/g, '') === email)
                        game.player1 = socket;
                    if (game.player2._userEmail.replace(/^"|"$/g, '') === email)
                        game.player2 = socket;
                    game.makeMove(socket, message.payload);
                    console.log(`Publishing game state for game ${game.gameId}`);
                    if (game.gameId) {
                        yield RedisClient_1.RedisPublisher.publish(game.gameId, JSON.stringify({ type: "move", payload: message.payload, game: game }));
                    }
                }
            }
            if (message.type === "reconnect_request") {
                console.log("inside reconnect request");
                const email = socket._userEmail.replace(/^"|"$/g, "");
                const id = yield this.getIdOfUser(email);
                const gameId = yield RedisClient_1.default.get(`user:${id}:game`);
                if (gameId) {
                    const gameState = yield RedisClient_1.default.get(`game:${gameId}`);
                    if (gameState) {
                        const parsedState = JSON.parse(gameState);
                        const pgnOfGame = yield client.game.findUnique({
                            where: {
                                id: gameId,
                            },
                            select: {
                                moves: true,
                                fen: true
                            },
                        });
                        const playerColor = parsedState.player1Id === id ? "white" : "black";
                        const turnFromFe = (pgnOfGame === null || pgnOfGame === void 0 ? void 0 : pgnOfGame.fen.split(" ")[1]) === "w" ? "white" : "black";
                        // Send restored game state
                        socket.send(JSON.stringify({
                            type: Message_1.INIT_GAME,
                            payload: { moves: pgnOfGame === null || pgnOfGame === void 0 ? void 0 : pgnOfGame.moves, fen: pgnOfGame === null || pgnOfGame === void 0 ? void 0 : pgnOfGame.fen, gameId: gameId },
                            gameId: gameId,
                            color: turnFromFe,
                        }));
                        // Remove the disconnection marker
                        yield RedisClient_1.default.del(`game:${gameId}:player:${id}:disconnected`);
                        // Re-add player to WebSocket handler
                        yield webSocketHandler.addParticipant(gameId, socket);
                        return;
                    }
                }
            }
        }));
    }
    addSpectator(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`inside game manager add spectator `);
            socket.on("message", (data) => __awaiter(this, void 0, void 0, function* () {
                const message = JSON.parse(data.toString());
                if (message.type === Message_1.JOIN_SPECTATOR) {
                    const gameId = message.payload.gameId;
                    console.log("gameId inside join spectator", gameId);
                    yield webSocketHandler.addSpectator(gameId, socket);
                }
            }));
        });
    }
}
exports.GameManager = GameManager;
