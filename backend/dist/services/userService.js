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
exports.userService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.userService = {
    getUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.user.findUnique({ where: { id } });
        });
    },
    getUserGames(id) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("reached inside get user games");
            console.log(typeof (id));
            const user = yield prisma.user.findFirst({
                where: {
                    id: id
                },
                select: {
                    name: true,
                    id: true,
                }
            });
            console.log("user info", user);
            // if (!user) {
            //   throw new Error('User not found');
            // }
            const gamesAsPlayer1 = yield prisma.game.findMany({ where: { player1Id: id } });
            console.log("games as player 1", gamesAsPlayer1);
            const gamesAsPlayer2 = yield prisma.game.findMany({ where: { player2Id: id } });
            console.log("games as player 2", gamesAsPlayer2);
            console.log("games as player 1 and 2", [...gamesAsPlayer1, ...gamesAsPlayer2]);
            return [...gamesAsPlayer1, ...gamesAsPlayer2];
        });
    },
};
