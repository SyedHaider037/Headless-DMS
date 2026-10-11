import { NextFunction, Request, Response } from "express";  
import { users } from "../schemas/user.schema";
import { AuthService } from "../services/auth.service";
import { matchRes } from "@carbonteq/fp";
import jwt from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user?: typeof users.$inferSelect; 
        }
    }
}     

type MyToken = {
    id: string;
    email: string;
    username: string;
}    

export const verifyAuthToken = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as MyToken;
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return res.status(403).json({ error: "Token Expired error" });      
        }
        return res.status(500).json({ error: "Invalid Token error" });   
    }

    if (!decoded.id) {
        return res.status(400).json({ error: "Invalid token payload" });
    }

    const user = await AuthService.verifyToken(decoded.id);

    return matchRes(user,{
        Ok: (decodedUser) => {
            req.user = decodedUser;
            return next();
        },
        Err: (error) => res.status(401).json({error})
    });
};