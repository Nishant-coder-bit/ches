import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"

export const UserMiddleware = (req:Request,res:Response,next:NextFunction)=>{
    const header = req.headers["authorization"];
    const token = header?.split(" ")[1]; 
    const decoded = jwt.verify(token as string,"12345");

 
    console.log("decoded",decoded);
    if(decoded){
        //@ts-ignore
        req.userId = decoded.id;
        next();
    }else{
        res.status(403).json({
            message: "You are not logged in"
        })
    }
}