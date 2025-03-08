import { Router } from 'express';
import { userController } from '../controller/userController';
import { UserMiddleware } from '../middleware/userMiddleware';



const router = Router();

/**
 * @swagger
 * /user/userInfo:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of users
 *     responses:
 *       200:
 *         description: A list of users
 */
router.get('/userInfo',UserMiddleware, userController.getUser);

router.get('/userGameInfo',UserMiddleware, userController.getUserGames);
router.post('/login',userController.loginUser as any);
router.post('/signup',userController.signupUser)
export default router;
