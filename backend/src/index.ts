import express from 'express';
import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import { SessionService } from './services/SessionService';
import cors from 'cors';
import RedisClient from './utils/RedisClient';
import gameRoutes from './routes/gameRoutes';
import userRoutes from './routes/userRoutes';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

app.use('/game', gameRoutes);
app.use('/user', userRoutes);


const gameManager = new GameManager();
const wss = new WebSocketServer({ noServer: true });

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
wss.on('connection', async (ws, req: any) => {
  try {
    const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
    //@ts-ignore
    const decoded = await SessionService.validateAuthToken(token);
    
    if (!decoded) {
      ws.close(4403, 'Unauthorized');
      return;
    }

    (ws as any).userId = decoded.userId;
    
    // Check for existing game
    const existingGameId = await RedisClient.client.get(`user:${decoded.userId}:game`);
    if (existingGameId) {
      await gameManager.handleReconnection(ws, existingGameId);
    }

    ws.on('message', async (message) => {
      const data = JSON.parse(message.toString());
       console.log("data",data);
      switch (data.type) {
        case 'CREATE_GAME':
          try {
            const gameContext = await gameManager.createGame(data.userId, ws);
            if (gameContext) {
              ws.send(JSON.stringify({ type: 'GAME_CREATED', gameId: gameContext.gameId , status:gameContext.status }));
            }
          } catch (error) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Failed to create game' }));
          }
        case 'JOIN_GAME':
          try {

            // const gameContext = await SessionService.validateGameToken(data.token);
            // if (gameContext) {
             const response =  await gameManager.joinGame(ws,data.userId);
              ws.send(JSON.stringify({ type: 'GAME_JOINED', gameId: response.gameId , status:response.status, color:response.color }));
            // }
          } catch (error) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Failed to join game' }));
          }
          break;

        case 'MOVE':
          try {
            const game = await gameManager.getGame(data.userId);
            if (game) {
              await game.makeMove((ws as any).userId, data.move);
            }
          } catch (error) {
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

const server = app.listen(process.env.PORT || 8080);
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});