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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const userService_1 = require("../services/userService");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client = new client_1.PrismaClient();
exports.userController = {
    getUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const id = req.userId;
                const user = yield userService_1.userService.getUser(id);
                res.json(user);
            }
            catch (error) {
                res.status(500).send('Internal Server Error');
            }
        });
    },
    getUserGames(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const id = req.userId;
                const games = yield userService_1.userService.getUserGames(id);
                res.json(games);
            }
            catch (error) {
                res.status(500).send('Internal Server Error');
            }
        });
    },
    signupUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //add zod validation here
            const name = req.body.name.toString();
            const email = req.body.email.toString();
            const password = req.body.password;
            console.log("request reached to signup endpoint");
            try {
                yield client.user.create({
                    data: {
                        name,
                        email,
                        password
                    }
                });
                res.json({
                    message: "user signed up successfully"
                });
            }
            catch (e) {
                console.log("error while signup", e);
                res.status(411).json({
                    message: "User already exists"
                });
            }
        });
    },
    loginUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const email = req.body.email.toString();
            const password = req.body.password;
            const existingUser = yield client.user.findFirst({
                where: {
                    email,
                    password
                }
            });
            if (existingUser) {
                const token = jsonwebtoken_1.default.sign({
                    id: existingUser.id
                }, "12345");
                res.json({
                    token
                });
            }
            else {
                res.status(403).json({
                    message: "Incorrrect credentials"
                });
            }
        });
    }
};
