"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameController = void 0;
const gameService_1 = require("../services/gameService");
exports.gameController = {
    getGame(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const game = yield gameService_1.gameService.getGame(req.params.id);
                res.json(game);
            }
            catch (error) {
                res.status(500).send('Internal Server Error');
            }
        });
    },
    recoverGame(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const game = yield gameService_1.gameService.recoverGame(req.params.id);
                res.json(game);
            }
            catch (error) {
                res.status(500).send('Internal Server Error');
            }
        });
    },
    addSpectator(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield gameService_1.gameService.addSpectator(req.params.gameId, req.body.email);
                res.status(200).send('Spectator added');
            }
            catch (error) {
                res.status(500).send('Internal Server Error');
            }
        });
    },
};
