
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
import { setupSwagger } from './swagger';
dotenv.config();
import jwt from 'jsonwebtoken';

const app = express();
setupSwagger(app);
const client = new PrismaClient();

app.use(express.json());
app.use(cors());
const port = process.env.PORT || 8080;
const wss = new WebSocketServer({ noServer: true });
const gameManager = new GameManager();

app.use(express.json());
app.use('/game', gameRoutes);
app.use('/user', userRoutes);

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});


wss.on('connection', async function connection(ws, req:any) {
  await client.$connect();
 
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  const gameId = url.searchParams.get("gameId"); 
  console.log("gameId inside index.ts web socket server",gameId);
  console.log("inside server token", token);

  try {
    let payload:any;
    if(token){
       payload = jwt.verify(token, "12345") // Verify token
       console.log("payload",payload);
       //@ts-ignore
       const email = payload.id;
       console.log("email",email);
   
       (ws as any)._userEmail =email; 
       await client.$connect(); 
       QueueWorker;
       gameManager.addUser(ws);
  
    }
    gameManager.addSpectator(ws);
    ws.on('close', () => {
      if(token){

        gameManager.removeUser(ws);
      }
    });
  }
    catch (err) {
      console.error('Invalid WebSocket token', err);
      ws.close(); 
    }
});

