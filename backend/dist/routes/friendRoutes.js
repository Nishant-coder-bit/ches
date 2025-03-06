"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const friendController_1 = require("../controller/friendController");
const router = (0, express_1.Router)();
router.post("/api/friends/add", friendController_1.friendController.addFriend);
router.get("/api/friends/:userId", friendController_1.friendController.getFriends);
