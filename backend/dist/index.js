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
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use('/game', gameRoutes_1.default);
app.use('/user', userRoutes_1.default);
const gameManager = new GameManager_1.GameManager();
const wss = new ws_1.WebSocketServer({ noServer: true });
// // REST endpoints
// app.post('/api/games', async (req, res) => {
//   try {
//     const { player1Id, player2Id } = req.body;
//     const game = await gameManager.createGame(player1Id, null);
//     const gameToken = SessionService.generateGameToken(player1Id,gameId);
//     res.json({ gameId: game.gameId });
//   } catch (error) {
//     res.status(500).json({ error: 'Game creation failed' });
//   }
// });
// WebSocket handling
wss.on('connection', (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
        //@ts-ignore
        const decoded = yield SessionService_1.SessionService.validateAuthToken(token);
        if (!decoded) {
            ws.close(4403, 'Unauthorized');
            return;
        }
        ws.userId = decoded.userId;
        // Check for existing game
        const existingGameId = yield RedisClient_1.default.client.get(`user:${decoded.userId}:game`);
        if (existingGameId) {
            yield gameManager.handleReconnection(ws, existingGameId);
        }
        ws.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
            const data = JSON.parse(message.toString());
            console.log("data", data);
            switch (data.type) {
                case 'CREATE_GAME':
                    try {
                        const gameContext = yield gameManager.createGame(data.userId, ws);
                        if (gameContext) {
                            ws.send(JSON.stringify({ type: 'GAME_CREATED', gameId: gameContext.gameId, status: gameContext.status }));
                        }
                    }
                    catch (error) {
                        ws.send(JSON.stringify({ type: 'ERROR', message: 'Failed to create game' }));
                    }
                case 'JOIN_GAME':
                    try {
                        // const gameContext = await SessionService.validateGameToken(data.token);
                        // if (gameContext) {
                        const response = yield gameManager.joinGame(ws, data.userId);
                        ws.send(JSON.stringify({ type: 'GAME_JOINED', gameId: response.gameId, status: response.status, color: response.color }));
                        // }
                    }
                    catch (error) {
                        ws.send(JSON.stringify({ type: 'ERROR', message: 'Failed to join game' }));
                    }
                    break;
                case 'MOVE':
                    try {
                        const game = yield gameManager.getGame(data.userId);
                        if (game) {
                            yield game.makeMove(ws.userId, data.move);
                        }
                    }
                    catch (error) {
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
const server = app.listen(process.env.PORT || 8080);
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
