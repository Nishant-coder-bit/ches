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
exports.WebSocketHandler = void 0;
const RedisClient_1 = __importDefault(require("./RedisClient"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class WebSocketHandler {
    constructor() {
        this.gameParticipants = new Map();
        this.gameSpectators = new Map();
    }
    addParticipant(gameId, socket) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.gameParticipants.has(gameId)) {
                this.gameParticipants.set(gameId, new Set());
            }
            (_a = this.gameParticipants.get(gameId)) === null || _a === void 0 ? void 0 : _a.add(socket);
            const email = socket._userEmail;
            // const email = "abc@gmail.com";
            yield RedisClient_1.default.rpush(`game:${gameId}:participants`, email);
            yield prisma.participant.create({
                data: { gameId, userEmail: email }
            });
        });
    }
    addSpectator(gameId, socket) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.gameSpectators.has(gameId)) {
                this.gameSpectators.set(gameId, new Set());
            }
            (_a = this.gameSpectators.get(gameId)) === null || _a === void 0 ? void 0 : _a.add(socket);
            const email = socket._userEmail;
            yield RedisClient_1.default.rpush(`game:${gameId}:spectators`, email);
        });
    }
    handleDisconnection(gameId, socket) {
        return __awaiter(this, void 0, void 0, function* () {
            const participantSet = this.gameParticipants.get(gameId);
            if (participantSet === null || participantSet === void 0 ? void 0 : participantSet.has(socket)) {
                participantSet.delete(socket);
                if (participantSet.size === 0) {
                    this.gameParticipants.delete(gameId);
                    yield RedisClient_1.default.del(`game:${gameId}:participants`);
                    // await prisma.participant.deleteMany({ where: { gameId } });
                }
            }
            const spectatorSet = this.gameSpectators.get(gameId);
            if (spectatorSet === null || spectatorSet === void 0 ? void 0 : spectatorSet.has(socket)) {
                spectatorSet.delete(socket);
                if (spectatorSet.size === 0) {
                    this.gameSpectators.delete(gameId);
                    yield RedisClient_1.default.del(`game:${gameId}:spectators`);
                }
            }
        });
    }
    getParticipants(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.gameParticipants.get(gameId) || new Set();
        });
    }
    getSpectators(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.gameSpectators.get(gameId) || new Set();
        });
    }
    recoverParticipants(gameId, users) {
        return __awaiter(this, void 0, void 0, function* () {
            const participantEmails = yield RedisClient_1.default.lpop(`game:${gameId}:participants`);
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
                    this.addParticipant(gameId, user);
                }
            }
        });
    }
}
exports.WebSocketHandler = WebSocketHandler;
