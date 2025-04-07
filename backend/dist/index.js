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
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const GameManager_1 = require("./GameManager");
const SessionService_1 = require("./services/SessionService");
const cors_1 = __importDefault(require("cors"));
const RedisClient_1 = __importDefault(require("./utils/RedisClient"));
const gameRoutes_1 = __importDefault(require("./routes/gameRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use('/game', gameRoutes_1.default);
app.use('/user', userRoutes_1.default);
const gameManager = new GameManager_1.GameManager();
const wss = new ws_1.WebSocketServer({ noServer: true });
const client = new client_1.PrismaClient();
wss.on('connection', (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
        //@ts-ignore
        const decoded = yield SessionService_1.SessionService.validateAuthToken(token);
        if (!decoded) {
            ws.close(403, 'Unauthorized');
            return;
        }
        console.log("decoded", decoded);
        const userId = yield client.user.findUnique({
            where: {
                email: decoded.id
            },
            select: {
                id: true
            }
        });
        ws.userId = userId === null || userId === void 0 ? void 0 : userId.id;
        const existingGameId = yield RedisClient_1.default.get(`user:${userId === null || userId === void 0 ? void 0 : userId.id}:game`);
        if (existingGameId) {
            console.log("existing game id", existingGameId);
            yield gameManager.handleReconnection(ws, userId === null || userId === void 0 ? void 0 : userId.id);
        }
        ws.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
            let data;
            try {
                console.log("message", message.toString());
                data = JSON.parse(message.toString());
            }
            catch (e) {
                console.log("error", e);
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON' }));
                return;
            }
            switch (data.type) {
                case 'CREATE_GAME':
                    try {
                        const gameContext = yield gameManager.createGame(data.userId, ws);
                        if (gameContext) {
                            const data = JSON.stringify({ type: 'GAME_CREATED', gameId: gameContext.gameId, status: gameContext.status });
                            broadcastToAllConnectedClients(data, ws);
                        }
                    }
                    catch (error) {
                        ws.send(JSON.stringify({ type: 'ERROR', message: 'Failed to create game' }));
                    }
                    break;
                case 'JOIN_GAME':
                    try {
                        // const gameContext = await SessionService.validateGameToken(data.token);
                        // if (gameContext) {
                        const response = yield gameManager.joinGame(ws, data.userId);
                        const broadcastData = (JSON.stringify({ type: 'GAME_JOINED', gameId: response.gameId, status: response.status, color: response.color }));
                        broadcastToAllConnectedClients(broadcastData, ws);
                    }
                    catch (error) {
                        console.error('Error joining game:', error);
                        ws.send(JSON.stringify({ type: 'ERROR', message: 'Failed to join game' }));
                    }
                    break;
                case 'MOVE':
                    try {
                        const game = yield gameManager.getGame(data.userId);
                        console.log("game inside move ", game);
                        if (game) {
                            yield game.makeMove(ws.userId, data.move);
                        }
                    }
                    catch (error) {
                        console.error('Error making move:', error);
                        ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid move' }));
                    }
                    break;
            }
        }));
        ws.on('close', () => {
            // handle disconnect
        });
    }
    catch (error) {
        console.error('WebSocket error:', error);
        ws.close();
    }
}));
const server = app.listen(process.env.PORT || 8080, () => {
    console.log(`Server is running on port ${process.env.PORT || 8080}`);
});
function broadcastToAllConnectedClients(data, ws) {
    // Broadcast to all connected clients
    wss.clients.forEach((client) => __awaiter(this, void 0, void 0, function* () {
        if (client.readyState === ws_1.WebSocket.OPEN && client !== ws) {
            yield client.send(data);
        }
    }));
}
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
