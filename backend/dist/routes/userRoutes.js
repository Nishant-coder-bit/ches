"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controller/userController");
const userMiddleware_1 = require("../middleware/userMiddleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User-related API endpoints
 */
/**
 * @swagger
 * /user/userInfo:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user information
 *     description: Retrieves information of the logged-in user.
 *     responses:
 *       200:
 *         description: Successfully retrieved user information.
 *       401:
 *         description: Unauthorized access.
 */
router.get("/userInfo", userMiddleware_1.UserMiddleware, userController_1.userController.getUser);
/**
 * @swagger
 * /user/userGameInfo:
 *   get:
 *     tags:
 *       - User
 *     summary: Get all games of the user
 *     description: Retrieves all games where the user is either player1 or player2.
 *     responses:
 *       200:
 *         description: Successfully retrieved user game data.
 *       401:
 *         description: Unauthorized access.
 */
router.get("/userGameInfo", userMiddleware_1.UserMiddleware, userController_1.userController.getUserGames);
/**
 * @swagger
 * /user/login:
 *   post:
 *     tags:
 *       - User
 *     summary: User login
 *     description: Authenticates a user with email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: User logged in successfully.
 *       401:
 *         description: Invalid credentials.
 *       404:
 *         description: User does not exist.
 */
//@ts-ignore
router.post("/login", userController_1.userController.loginUser);
/**
 * @swagger
 * /user/signup:
 *   post:
 *     tags:
 *       - User
 *     summary: User signup
 *     description: Creates a new user account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: User signed up successfully.
 *       409:
 *         description: User already exists.
 */
router.post("/signup", userController_1.userController.signupUser);
exports.default = router;
