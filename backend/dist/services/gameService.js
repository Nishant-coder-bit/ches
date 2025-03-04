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
    // async addSpectator(gameId: string, socket: WebSocket) {
    //    // Placeholder for WebSocket object
    //   const gameManager = new GameManager();
    //   await gameManager.addSpectator(gameId, socket);
    // },
};
