// src/middleware/GameMiddleware.ts (NEW)
import { WebSocket } from 'ws';
import { SessionService } from '../services/SessionService';


export class GameMiddleware {
  // Validate WebSocket connection
  static async authenticateConnection(ws: WebSocket, token: string): Promise<boolean> {
    const decoded = await SessionService.validateGameToken(token);
    if (!decoded) {
      ws.close(4403, 'Unauthorized');
      return false;
    }

    (ws as any).gameContext = decoded;
    return true;
  }

  // Authorize move action
  static async authorizeMove(ws: WebSocket, gameId: string): Promise<boolean> {
    const context = (ws as any).gameContext;
    if (!context || context.gameId !== gameId) {
      ws.close(4403, 'Unauthorized move');
      return false;
    }
    return true;
  }
}