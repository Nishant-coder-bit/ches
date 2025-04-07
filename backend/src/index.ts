import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import { SessionService } from './services/SessionService';
import cors from 'cors';
import RedisClient from './utils/RedisClient';
import gameRoutes from './routes/gameRoutes';
import userRoutes from './routes/userRoutes';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

app.use('/game', gameRoutes);
app.use('/user', userRoutes);


const gameManager = new GameManager();
const wss = new WebSocketServer({ noServer: true });
const client = new PrismaClient();

wss.on('connection', async (ws, req: any) => {
  try {
    const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
    //@ts-ignore
    const decoded = await SessionService.validateAuthToken(token);
    
    if (!decoded) {
      ws.close(403, 'Unauthorized');
      return;
    }
     console.log("decoded",decoded);
    const userId = await client.user.findUnique({
       where:{
        email:decoded.id
       },
        select:{
          id:true
        }
    });
    (ws as any).userId =userId?.id;
    const existingGameId = await RedisClient.get(`user:${userId?.id}:game`);
    if (existingGameId) {
      console.log("existing game id",existingGameId);
    await gameManager.handleReconnection(ws, userId?.id);
    
    }

    ws.on('message', async (message:any) => {
      let data;
      try{
        console.log("message",message.toString());
   
         data = JSON.parse(message.toString());

      
      }
     catch(e){
      console.log("error",e);
       ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON' }));
       return;
     }
      switch (data.type) {
        case 'CREATE_GAME':
          try {
            const gameContext = await gameManager.createGame(data.userId, ws);
            if (gameContext) {
              const data = JSON.stringify({ type: 'GAME_CREATED', gameId: gameContext.gameId , status:gameContext.status });
              broadcastToAllConnectedClients(data,ws);
            
            }
          } catch (error) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Failed to create game' }));
          }
         break;
        case 'JOIN_GAME':
          try {

            // const gameContext = await SessionService.validateGameToken(data.token);
            // if (gameContext) {
             const response =  await gameManager.joinGame(ws,data.userId);

              const broadcastData = (JSON.stringify({ type: 'GAME_JOINED', gameId: response.gameId , status:response.status, color:response.color }));
              broadcastToAllConnectedClients(broadcastData,ws);
          } catch (error) {
            console.error('Error joining game:', error);
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Failed to join game' }));
          }
          break;

        case 'MOVE':
          try {
            const game = await gameManager.getGame(data.userId);
            console.log("game inside move ",game);
            if (game) {
              await game.makeMove((ws as any).userId, data.move);
            }
          } catch (error) {
            console.error('Error making move:', error);
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid move' }));
          }
          break;
      }
    });

    ws.on('close', () => {
      // handle disconnect
    });
  } catch (error) {
    console.error('WebSocket error:', error);
    ws.close();
  }
});

const server = app.listen(process.env.PORT || 8080,()=>{
  console.log(`Server is running on port ${process.env.PORT || 8080}`);
});
 function broadcastToAllConnectedClients(data:any,ws?:WebSocket){
  // Broadcast to all connected clients
wss.clients.forEach(async client => {
  if (client.readyState === WebSocket.OPEN && client !== ws) {
   await client.send(data);
  }
});

}
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});