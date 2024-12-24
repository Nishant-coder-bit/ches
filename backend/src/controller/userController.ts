import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { PrismaClient } from '@prisma/client';
import jwt from "jsonwebtoken"
const client = new PrismaClient();
export const userController = {
  async getUser(req: Request, res: Response) {
    try {
        //@ts-ignore
        const id = req.userId;
      const user = await userService.getUser(id);
      res.json(user);
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  },

  async getUserGames(req: Request, res: Response) {
    try {
        //@ts-ignore
        const id = req.userId;
      const games = await userService.getUserGames(id);
      res.json(games);
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  },
  async signupUser(req:Request,res:Response){
    //add zod validation here
      const name = req.body.name.toString();
      const email = req.body.email.toString();
      const password = req.body.password;
      console.log("request reached to signup endpoint");
      try{
         await  client.user.create({
            data:{
                name,
                email,
                password
            }
         })
         res.json({
            message:"user signed up successfully"
         })
      }catch(e){
        console.log("error while signup",e);
        res.status(411).json({
            message: "User already exists"
        })
      }
  },
 async loginUser(req:Request,res:Response){
      const email = req.body.email.toString();
      const password = req.body.password;
      const existingUser = await client.user.findFirst({
          where:{
            email,
            password
          }
      })
      if(existingUser){
        const token = jwt.sign({
            id:existingUser.id
        },"12345");
        res.json({
            token
        })
      }
      else {
        res.status(403).json({
            message: "Incorrrect credentials"
        })
    }
  }
};

