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
                const email = req.userEmail;
                const user = yield userService_1.userService.getUser(email);
                console.log("inside get user data ", user);
                res.json(user);
            }
            catch (error) {
                console.log("error while getting user", error);
                res.status(500).send("Internal Server Error");
            }
        });
    },
    getUserGames(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const email = req.userEmail;
                const games = yield userService_1.userService.getUserGames(email);
                res.json(games);
            }
            catch (error) {
                res.status(500).send("Internal Server Error");
            }
        });
    },
    signupUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //add zod validation here
            try {
                yield client.user.create({
                    data: {
                        name: req.body.name,
                        email: req.body.email,
                        password: req.body.password,
                    },
                });
                const email = (req.body).email;
                const existingUser = yield client.user.findFirst({
                    where: {
                        email
                    },
                });
                const token = jsonwebtoken_1.default.sign({
                    id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.email,
                }, "12345");
                res.json({
                    message: "user signed up successfully",
                    token: token,
                });
            }
            catch (e) {
                console.log("error while signup", e);
                res.status(411).json({
                    message: "User already exists",
                });
            }
        });
    },
    loginUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("request reaching inside login page");
                console.log("req.body", req.body);
                const email = req.body.email;
                const password = req.body.password;
                console.log("email and password", email, password);
                const existingUser = yield client.user.findUnique({
                    where: {
                        email
                    },
                });
                // console.log("existing user", existingUser);
                if (!existingUser) {
                    return res.status(404).json({
                        message: "User not found",
                    });
                }
                console.log("existing user", existingUser);
                if (password !== existingUser.password) {
                    console.log("password", password);
                    console.log("existing user password", existingUser.password);
                    return res.status(401).json({ message: "Invalid password" });
                }
                const token = jsonwebtoken_1.default.sign({
                    id: existingUser.email,
                }, "12345");
                res.json({
                    token,
                });
            }
            catch (e) {
                console.log("error while login", e);
                res.status(500).send("Internal Server Error!!!. Please Check your email and password");
            }
        });
    },
};
