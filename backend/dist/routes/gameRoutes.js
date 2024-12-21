"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gameController_1 = require("../controller/gameController");
const router = (0, express_1.Router)();
router.get('/:id', gameController_1.gameController.getGame);
router.get('/:id/recover', gameController_1.gameController.recoverGame);
router.post('/:gameId/spectate', gameController_1.gameController.addSpectator);
exports.default = router;
