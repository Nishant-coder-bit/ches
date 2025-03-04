
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

const app = express();
const client = new PrismaClient();

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


wss.on('connection', async function connection(ws, req:any) {
  await client.$connect();
 
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token'); // Extract token using searchParams

  console.log("inside server token", token);

  try {
    let payload:any;
    if(token){
       payload = jwt.verify(token, "12345");
    }
   // Verify token
    console.log("payload",payload);
    //@ts-ignore
    const email = payload.id;
    //  const emailObj = await client.user.findUnique({
    //   where: {
    //     id: id,
    //   },
    //   select: {
    //     email: true,
    //   },
    // });
    console.log("email",email);

    (ws as any)._userEmail =email; // Attach email to WebSocket object
    await client.$connect(); // Connect to Prisma
      // start processing the redis queue
    QueueWorker; // Process Redis queue
    console.log("reaching here on click of signup/login button ")
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

