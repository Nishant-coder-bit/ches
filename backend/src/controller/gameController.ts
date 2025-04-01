import { Request, Response } from 'express';
import { gameService } from '../services/gameService';

export const gameController = {
  // async getGame(req: Request, res: Response) {
  //   try {
  //     const game = await gameService.getGame(req.params.id);
  //     res.json(game);
  //   } catch (error) {
  //     res.status(500).send('Internal Server Error');
  //   }
  // },

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
      await gameService.addSpectator(req.params.gameId);
      res.status(200).send('Spectator added');
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  },

   async getGamesByStatus(req: Request, res: Response) {
    try {
      console.log("inside get ongoing games");
      const status = req.query.status;
     const games =  await gameService.getGamesByStatus(status);
    
      res.status(200).send(games);
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  }
  
};
