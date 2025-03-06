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
const dotenv_1 = __importDefault(require("dotenv"));
const gameRoutes_1 = __importDefault(require("./routes/gameRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const GameManager_1 = require("./GameManager");
const client_1 = require("@prisma/client");
const url_1 = require("url");
const cors_1 = __importDefault(require("cors"));
const QueueWorker_1 = __importDefault(require("./utils/QueueWorker"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = (0, express_1.default)();
const client = new client_1.PrismaClient();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const port = process.env.PORT || 8080;
const wss = new ws_1.WebSocketServer({ noServer: true });
const gameManager = new GameManager_1.GameManager();
app.use(express_1.default.json());
app.use('/game', gameRoutes_1.default);
app.use('/user', userRoutes_1.default);
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
wss.on('connection', function connection(ws, req) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.$connect();
        const url = new url_1.URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        console.log("inside server token", token);
        try {
            let payload;
            if (token) {
                payload = jsonwebtoken_1.default.verify(token, "12345");
            }
            // Verify token
            console.log("payload", payload);
            //@ts-ignore
            const email = payload.id;
            console.log("email", email);
            ws._userEmail = email;
            yield client.$connect();
            QueueWorker_1.default;
            gameManager.addUser(ws);
            ws.on('close', () => {
                gameManager.removeUser(ws);
            });
        }
        catch (err) {
            console.error('Invalid WebSocket token', err);
            ws.close();
        }
    });
});
