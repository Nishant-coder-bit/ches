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
exports.gameService = void 0;
const client_1 = require("@prisma/client");
const RedisClient_1 = require("../utils/RedisClient");
// import { WebSocketHandler } from '../WebSocketHandler';
const prisma = new client_1.PrismaClient();
exports.gameService = {
    getGame(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.game.findUnique({ where: { id: gameId } });
        });
    },
    // async recoverGame(gameId: string) {
    //   return prisma.game.findUnique({ where: { id: gameId } });
    // },
    addSpectator(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Adding spectator to game: ${gameId}`);
            // Subscribe to Redis game updates
            RedisClient_1.RedisSubscriber.subscribe(gameId, (err) => {
                if (err)
                    console.error(`Failed to subscribe to ${gameId}:`, err);
            });
        });
    },
    getOngoingGames() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const games = yield prisma.game.findMany({
                    where: { status: "ongoing" },
                    select: { id: true, player1Id: true, player2Id: true }, // Adjust based on your schema
                });
                console.log(`games are  ${games}`);
                return games;
            }
            catch (error) {
                console.error("Error fetching ongoing games:", error);
                return null;
            }
        });
    },
};
