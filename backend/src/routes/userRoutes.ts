import { Router } from 'express';
import { userController } from '../controller/userController';
import { UserMiddleware } from '../middleware/userMiddleware';



const router = Router();

router.get('/userInfo',UserMiddleware, userController.getUser);
router.get('/userGameInfo',UserMiddleware, userController.getUserGames);
router.post('/login',userController.loginUser)
router.post('/signup',userController.signupUser)
export default router;
