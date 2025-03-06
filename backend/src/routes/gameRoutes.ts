import { Router } from 'express';
import { gameController } from '../controller/gameController';


const router = Router();

// router.get('/game/:id', gameController.getGame);
// router.get('/:id/recover', gameController.recoverGame);
router.post('/:gameId/spectate', gameController.addSpectator);
router.get('/ongoing',gameController.getOngoingGames);

export default router;
