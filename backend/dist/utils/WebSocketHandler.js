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
    // private gameSpectators: Map<string, Set<WebSocket>>;
    constructor() {
        this.gameParticipants = new Map();
        // this.gameSpectators = new Map();
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
}
exports.WebSocketHandler = WebSocketHandler;
