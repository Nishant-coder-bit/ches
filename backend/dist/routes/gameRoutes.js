"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gameController_1 = require("../controller/gameController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   - name: Game
 *     description: Game-related API endpoints
 */
/**
 * @swagger
 * /game/{gameId}/spectate:
 *   post:
 *     tags:
 *       - Game
 *     summary: Add a spectator to the game
 *     description: Allows a user to spectate an ongoing game.
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game to spectate.
 *     responses:
 *       200:
 *         description: Spectator successfully added.
 *       500:
 *         description: Internal Server Error.
 */
router.post("/:gameId/spectate", gameController_1.gameController.addSpectator);
/**
 * @swagger
 * /game/ongoing:
 *   get:
 *     tags:
 *       - Game
 *     summary: Get all ongoing games
 *     description: Retrieve all ongoing games. No login is required.
 *     responses:
 *       200:
 *         description: Returns an array of ongoing games.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/ongoing", gameController_1.gameController.getOngoingGames);
// router.get("/game/:id", gameController.getGame);
// router.get("/:id/recover", gameController.recoverGame);
// router.post("/create", gameController.createGame);
exports.default = router;
