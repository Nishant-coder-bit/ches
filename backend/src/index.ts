
import express from 'express';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import gameRoutes from './routes/gameRoutes';
import userRoutes from './routes/userRoutes';
import { GameManager } from './GameManager';
import { PrismaClient } from '@prisma/client';
import { URL } from 'url';
import cors from "cors"
dotenv.config();

const client = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 8080;
const wss = new WebSocketServer({ noServer: true });
const gameManager = new GameManager();

app.use(express.json());
app.use('/game', gameRoutes);
app.use('/user', userRoutes);

// Upgrade HTTP Server to Handle WebSocket Connections
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// WebSocket Connection Handler
wss.on('connection', async function connection(ws, req:any) {
  await client.$connect();

  // Parse the URL to get parameters
  const parameters = new URL(req.url, `http://${req.headers.host}`);
  const email = parameters.searchParams.get('email');
  
  // Attach email to the WebSocket object
  (ws as any)._userEmail = email;

  // Add user to the game manager
  gameManager.addUser(ws);

  ws.on('close', () => {
    gameManager.removeUser(ws);
  });
});

