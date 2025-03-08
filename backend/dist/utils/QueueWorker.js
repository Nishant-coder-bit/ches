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
            console.log(`Inside processQueue`);
            while (true) {
                // find all keys that match the pattern 'game:*:queue'
                const keys = yield RedisClient_1.default.keys('game:*:queue');
                for (const key of keys) {
                    const value = yield RedisClient_1.default.lpop(key);
                    if (value) {
                        const { gameId } = this.parseGameId(key);
                        console.log(`saving move to database: ${value}`);
                        yield this.saveMoveToDatabase(gameId, JSON.parse(value));
                    }
                }
                yield new Promise(resolve => setTimeout(resolve, 2000)); // Polling interval
            }
        });
    }
    parseGameId(queueKey) {
        const match = /game:(.*):queue/.exec(queueKey);
        console.log(`match is ${match}`);
        return { gameId: match ? match[1] : '' };
    }
    saveMoveToDatabase(gameId, value) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Inside saveMoveToDatabase and gameId is ${gameId} and data is ${value}`);
            try {
                // Check if the game exists
                const gameExists = yield prisma.game.findUnique({
                    where: { id: gameId },
                });
                if (!gameExists) {
                    console.error('Game not found for gameId:', gameId);
                    return;
                }
                if (value.isGameOver === true) {
                    yield prisma.game.update({
                        where: { id: gameId },
                        data: { winnerId: value.winner },
                    });
                }
                else {
                    yield prisma.game.update({
                        where: { id: gameId },
                        data: { moves: value.pgn, fen: value.fen },
                    });
                }
                console.log('Move stored in database:', Object.assign({ gameId }, value));
            }
            catch (error) {
                console.error('Error saving move to database:', error);
            }
        });
    }
}
exports.default = new QueueWorker();
