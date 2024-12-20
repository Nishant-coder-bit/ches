import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import { PrismaClient } from '@prisma/client';
import { URL } from 'url';
const client  = new PrismaClient();
const wss = new WebSocketServer({ port: 8080 });
const gameManager = new GameManager();
wss.on('connection', async function connection(ws, req:any) 
{ 
      await client.$connect(); 
    // Parse the URL to get parameters
       const parameters = new URL(req.url, `http://${req.headers.host}`);
      const email = parameters.searchParams.get('email'); 
       (ws as any)._userEmail = email; 
      ws.on('close', () => { gameManager.removeUser(ws); });
 });