import { Request, Response } from "express";
import { userService } from "../services/userService";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const client = new PrismaClient();

export const userController = {

  async getUser(req: Request, res: Response) {
    try {
      //@ts-ignore
      const email = req.userEmail;
      const user = await userService.getUser(email);

      console.log("inside get user data ", user);

      res.json(user);
    } catch (error) {
      console.log("error while getting user", error);
      res.status(500).send("Internal Server Error");
    }
  },

  async getUserGames(req: Request, res: Response) {
    try {
      //@ts-ignore
      const email = req.userEmail;
      const games = await userService.getUserGames(email);
      res.json(games);
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  },

  async signupUser(req: Request, res: Response) {
    //add zod validation here

    try {
      await client.user.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
        },
      });
      const email = (req.body).email
      const existingUser = await client.user.findFirst({
        where: {
          email
        },
      });
      const token = jwt.sign(
        {
          id: existingUser?.email,
        },
        "12345"
      );
      res.json({
        message: "user signed up successfully",
        token: token,
      });
    } catch (e) {
      console.log("error while signup", e);
      res.status(411).json({
        message: "User already exists",
      });
    }
  },

  async loginUser(req: Request, res: Response) {
    try{
      const email = req.body.email;
      const password = req.body.password;
      console.log("email and password", email, password);
      const existingUser = await client.user.findUnique({
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
      if(password !== existingUser.password){
        console.log("password", password);
        console.log("existing user password", existingUser.password);
        return res.status(401).json({ message: "Invalid password" });
      }
  
  
      const token = jwt.sign(
        {
          id: existingUser.email,
        },
        "12345"
      );
      res.json({
        token,
      });
    }catch(e){

      console.log("error while login", e);
      res.status(500).send("Internal Server Error!!!. Please Check your email and password");  
    }
   
  },
};
