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
const RedisClient_1 = __importDefault(require("./RedisClient"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class QueueWorker {
    constructor() {
        this.processQueue();
    }
    processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            while (true) {
                const keys = yield RedisClient_1.default.keys('game:*:queue');
                for (const key of keys) {
                    const move = yield RedisClient_1.default.lpop(key);
                    if (move) {
                        const { gameId } = this.parseGameId(key);
                        yield this.saveMoveToDatabase(gameId, JSON.parse(move));
                    }
                }
                yield new Promise(resolve => setTimeout(resolve, 1000)); // Polling interval
            }
        });
    }
    parseGameId(queueKey) {
        const match = /game:(.*):queue/.exec(queueKey);
        return { gameId: match ? match[1] : '' };
    }
    saveMoveToDatabase(gameId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if the game exists
                const gameExists = yield prisma.game.findUnique({
                    where: { id: gameId },
                });
                if (!gameExists) {
                    console.error('Game not found for gameId:', gameId);
                    return;
                }
                if (data.gameOver) {
                    yield prisma.game.update({
                        where: { id: gameId },
                        data: { winner: data.winner },
                    });
                }
                else {
                    console.log("gameId:---->", gameId);
                    console.log("data---->", data);
                    yield prisma.game.update({
                        where: { id: gameId },
                        data: { moves: data.pgn, fen: data.fen },
                    });
                }
                console.log('Move stored in database:', Object.assign({ gameId }, data));
            }
            catch (error) {
                console.error('Error saving move to database:', error);
            }
        });
    }
}
exports.default = new QueueWorker();
