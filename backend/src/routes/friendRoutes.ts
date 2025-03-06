import { Router } from "express";
import { friendController } from "../controller/friendController";


const router =  Router();

router.post("/api/friends/add", friendController.addFriend);
router.get("/api/friends/:userId", friendController.getFriends);