"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controller/userController");
const userMiddleware_1 = require("../middleware/userMiddleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of users
 *     responses:
 *       200:
 *         description: A list of users
 */
router.get('/userInfo', userMiddleware_1.UserMiddleware, userController_1.userController.getUser);
router.get('/userGameInfo', userMiddleware_1.UserMiddleware, userController_1.userController.getUserGames);
router.post('/login', userController_1.userController.loginUser);
router.post('/signup', userController_1.userController.signupUser);
exports.default = router;
