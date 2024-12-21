import { Request, Response } from 'express';
import { gameService } from '../services/gameService';

export const gameController = {
  async getGame(req: Request, res: Response) {
    try {
      const game = await gameService.getGame(req.params.id);
      res.json(game);
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  },

  async recoverGame(req: Request, res: Response) {
    try {
      const game = await gameService.recoverGame(req.params.id);
      res.json(game);
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  },

  async addSpectator(req: Request, res: Response) {
    try {
      await gameService.addSpectator(req.params.gameId, req.body.email);
      res.status(200).send('Spectator added');
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  },
};
