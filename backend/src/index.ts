
import express from 'express';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import gameRoutes from './routes/gameRoutes';
import userRoutes from './routes/userRoutes';
import { GameManager } from './GameManager';
import { PrismaClient } from '@prisma/client';
import { URL } from 'url';
import cors from "cors"
import QueueWorker from './utils/QueueWorker';
dotenv.config();
import jwt from 'jsonwebtoken';
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
  //after connect to database 

  const token = req.headers.authorization?.split(' ')[1]; 
  try {
    const payload = jwt.verify(token, "12345"); // Verify token
    //@ts-ignore
    const id = payload.id;
     const email = await client.user.findUnique({
      where: {
        id: id,
      },
      select: {
        email: true,
      },
    });
    (ws as any)._userEmail = email; // Attach email to WebSocket object
    await client.$connect(); // Connect to Prisma
      // start processing the redis queue
    QueueWorker; // Process Redis queue

    gameManager.addUser(ws); // Add user to game manager

    ws.on('close', () => {
      gameManager.removeUser(ws);
    });
  }
    catch (err) {
      console.error('Invalid WebSocket token', err);
      ws.close(); // Close WebSocket if token is invalid
    }
});

