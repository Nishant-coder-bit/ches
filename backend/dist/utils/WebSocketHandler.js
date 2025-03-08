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
exports.WebSocketHandler = void 0;
const RedisClient_1 = __importStar(require("./RedisClient"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class WebSocketHandler {
    constructor() {
        this.gameParticipants = new Map();
        this.spectators = new Map();
    }
    addParticipant(gameId, socket) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log(`inside add participant and gameId is ${gameId} and socket is ${socket}`);
            let count = 0;
            if (!this.gameParticipants.has(gameId)) {
                this.gameParticipants.set(gameId, new Set());
            }
            (_a = this.gameParticipants.get(gameId)) === null || _a === void 0 ? void 0 : _a.add(socket);
            const email = socket._userEmail.replace(/^"|"$/g, '');
            // const email = "abc@gmail.com";
            console.log("email", email);
            // TODO: why are we rpushing the email to the list of participants in redis? is it correct
            yield RedisClient_1.default.rpush(`game:${gameId}:participants`, email);
            yield prisma.participant.upsert({
                where: { gameId_userEmail: { gameId: gameId, userEmail: email } },
                create: { gameId: gameId, userEmail: email, createdAt: new Date() },
                update: { gameId: gameId, userEmail: email }
            });
            count++;
            console.log(`added participant ${email} to game ${gameId} and count is ${count}`);
        });
    }
    addSpectator(gameId, ws) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Adding spectator to game: ${gameId}`);
            if (!this.spectators.has(gameId)) {
                this.spectators.set(gameId, new Set());
            }
            this.spectators.get(gameId).add(ws);
            // Subscribe to Redis game updates
            yield RedisClient_1.RedisSubscriber.subscribe(gameId);
            RedisClient_1.RedisSubscriber.on("message", (channel, message) => {
                var _a;
                if (channel === gameId) {
                    console.log(`Sending update to spectators of game ${gameId}`);
                    (_a = this.spectators.get(gameId)) === null || _a === void 0 ? void 0 : _a.forEach((spectator) => {
                        spectator.send(message);
                    });
                }
            });
            ws.send(JSON.stringify({ message: "Spectating game", gameId }));
        });
    }
    // async handleDisconnection(gameId: string, socket: WebSocket): Promise<void> {
    //   const participantSet = this.gameParticipants.get(gameId);
    //   if (participantSet?.has(socket)) {
    //     participantSet.delete(socket);
    //     if (participantSet.size === 0) {
    //       this.gameParticipants.delete(gameId);
    //       await RedisClient.del(`game:${gameId}:participants`);
    //       // await prisma.participant.deleteMany({ where: { gameId } });
    //     }
    //   }
    //   const spectatorSet = this.gameSpectators.get(gameId);
    //   if (spectatorSet?.has(socket)) {
    //     spectatorSet.delete(socket);
    //     if (spectatorSet.size === 0) {
    //       this.gameSpectators.delete(gameId);
    //       await RedisClient.del(`game:${gameId}:spectators`);
    //     }
    //   }
    // }
    // async getParticipants(gameId: string): Promise<Set<WebSocket>> {
    //   return this.gameParticipants.get(gameId) || new Set();
    // }
    // async getSpectators(gameId: string): Promise<Set<WebSocket>> {
    //   return this.gameSpectators.get(gameId) || new Set();
    // }
    recoverParticipants(gameId, users) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`inside recover participants and gameId is ${gameId} and users are ${users}`);
            const participantEmails = yield RedisClient_1.default.lpop(`game:${gameId}:participants`);
            console.log("participantEmails", participantEmails);
            if (participantEmails) {
                const emails = JSON.parse(participantEmails);
                emails.forEach((email) => {
                    const user = users.find(user => user._userEmail === email);
                    if (user) {
                        this.addParticipant(gameId, user);
                    }
                });
            }
            const dbParticipants = yield prisma.participant.findMany({
                where: { gameId }
            });
            for (const participant of dbParticipants) {
                const user = users.find(user => user._userEmail === participant.userEmail);
                if (user) {
                    console.log("adding participants from db to game participants", user);
                    this.addParticipant(gameId, user);
                }
            }
            console.log("recover participants done");
            return Promise.resolve({ done: true, dbParticipants, participantEmails });
        });
    }
}
exports.WebSocketHandler = WebSocketHandler;
