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
const Game_1 = require("./models/Game");
const RedisClient_1 = __importDefault(require("./utils/RedisClient"));
const client_1 = require("@prisma/client");
const TIMETOLIVE = 60 * 5; // 5 minutes
const client = new client_1.PrismaClient();
class GameManager {
    constructor() {
        this.activeGames = new Map();
        this.waitingPlayers = new Map(); // userId -> WebSocket
    }
    createGame(userId, ws) {
        return __awaiter(this, void 0, void 0, function* () {
            // Store the player as waiting
            this.waitingPlayers.set(userId, ws);
            // Store in Redis that this player is waiting
            yield RedisClient_1.default.client.set(`waiting_player:${userId}`, 'true', "EX", TIMETOLIVE); // 5 minute timeout
            return {
                status: 'waiting',
                gameId: undefined,
            };
        });
    }
    declineGame(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const waitingPlayer = this.waitingPlayers.get(userId);
                if (waitingPlayer) {
                    waitingPlayer.close();
                    this.waitingPlayers.delete(userId);
                    yield RedisClient_1.default.del(`waiting_player:${userId}`);
                }
            }
            catch (error) {
                console.error("Error in declining game:", error);
                throw error;
            }
        });
    }
    stopGame(gameId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`insid stopGame with ${gameId} and ${userId}`);
            const game = this.activeGames.get(gameId);
            console.log("inside stopGame", game);
            if (game) {
                this.activeGames.delete(gameId);
                console.log("gameId deleted from activeGames", gameId);
                yield RedisClient_1.default.del(`game:${gameId}`);
                // how to delete key from redis 
                //update the status in db
                const gameToBeStopped = yield client.game.findUnique({
                    where: { id: gameId },
                    select: { player1Id: true, player2Id: true }
                });
                console.log("gameToBeStopped", gameToBeStopped);
                if (!gameToBeStopped)
                    return { status: 'not found', winnerId: null };
                yield RedisClient_1.default.del(`user:${gameToBeStopped.player1Id}:game`);
                yield RedisClient_1.default.del(`user:${gameToBeStopped.player2Id}:game`);
                const winnerId = gameToBeStopped.player1Id === userId ? gameToBeStopped.player2Id : gameToBeStopped.player1Id;
                yield client.game.update({
                    where: { id: gameId },
                    data: { status: 'COMPLETED', winnerId: winnerId }
                });
                return {
                    status: 'stopped',
                    winnerId: winnerId
                };
            }
        });
    }
    joinGame(ws, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if there's a waiting player
            const waitingPlayerId = yield this.findWaitingPlayer(userId);
            if (!waitingPlayerId) {
                // If no waiting player, create a new game and wait
                return this.createGame(userId, ws);
            }
            const waitingPlayerWs = this.waitingPlayers.get(waitingPlayerId);
            if (!waitingPlayerWs) {
                // Waiting player disconnected, clean up and start new wait
                yield RedisClient_1.default.del(`waiting_player:${waitingPlayerId}`);
                return this.createGame(userId, ws);
            }
            // Create a new game with both players
            const game = yield Game_1.Game.create(waitingPlayerWs, ws, waitingPlayerId, userId);
            this.activeGames.set(game.gameId, game);
            // const gameToken = SessionService.generateGameToken(userId,game.gameId);
            // Remove waiting player
            this.waitingPlayers.delete(waitingPlayerId);
            yield RedisClient_1.default.del(`waiting_player:${waitingPlayerId}`);
            return {
                status: 'ready',
                gameId: game.gameId,
                color: 'black',
            };
        });
    }
    handleReconnection(ws, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if user was in a game
            const gameId = yield RedisClient_1.default.get(`user:${userId}:game`);
            if (!gameId)
                return;
            const game = this.activeGames.get(gameId);
            if (!game) {
                // Game exists in Redis but not in memory - restore it
                const gameState = yield RedisClient_1.default.get(`game:${gameId}`);
                if (gameState) {
                    const parsedState = JSON.parse(gameState);
                    const restoredGame = yield Game_1.Game.restore(gameId, parsedState);
                    this.activeGames.set(gameId, restoredGame);
                    yield restoredGame.reconnectPlayer(ws, userId);
                    console.log("Game is restored for userId:", userId);
                }
            }
            else {
                // Game exists - reconnect player
                yield game.reconnectPlayer(ws, userId);
                console.log("is connected to active Game", userId);
            }
        });
    }
    getGame(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // First check if user is in a game
            const gameId = yield RedisClient_1.default.get(`user:${userId}:game`);
            if (!gameId)
                return null;
            // Check if game is in memory
            let game = this.activeGames.get(gameId);
            if (game)
                return game;
            // If not in memory, try to restore from Redis
            const gameFromRedis = yield RedisClient_1.default.get(`user:${userId}:game`);
            if (!gameFromRedis)
                return null;
            return gameFromRedis;
            // try {
            //   const parsedState = JSON.parse(gameState);
            //   game = await Game.restore(gameId, parsedState);
            //   if (!game) return null;
            //   this.activeGames.set(gameId, game);
            //   return game;
            // } catch (error) {
            //   console.error('Failed to restore game:', error);
            //   return null;
            // }
        });
    }
    findWaitingPlayer(excludeUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const waitingPlayers = yield RedisClient_1.default.keys('waiting_player:*');
            for (const key of waitingPlayers) {
                const waitingPlayerId = key.split(':')[1];
                if (waitingPlayerId !== excludeUserId) {
                    //matching should be done here using matching engine service
                    return waitingPlayerId;
                }
            }
            return null;
        });
    }
}
exports.GameManager = GameManager;
