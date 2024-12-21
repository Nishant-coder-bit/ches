import { Router } from 'express';
import { userController } from '../controller/userController';
import { UserMiddleware } from '../middleware/userMiddleware';


const router = Router();

router.get('/:email',UserMiddleware, userController.getUser);
router.get('/:email/games',UserMiddleware, userController.getUserGames);
router.post('/login',userController.loginUser)
router.post('/signup',userController.signupUser)
export default router;
