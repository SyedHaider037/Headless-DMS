import { NextFunction, Request, Response } from "express";  
import { users } from "../schemas/user.schema.js";
import { AuthService } from "../services/auth.service.js";
import { matchRes } from "@carbonteq/fp";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

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
        decoded = jwt.verify(token, config.accessToken.secret) as MyToken;
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Access token expired" });      
        }
        return res.status(401).json({ error: "Invalid access token" });   
    }

    if (!decoded.id) {
        return res.status(401).json({ error: "Invalid access token payload" });
    }

    const user = await AuthService.verifyToken(decoded.id);

    return matchRes<any, string, void>(user,{
        Ok: (decodedUser) => {
            req.user = decodedUser;
            return next();
        },
        Err: () => res.status(401).json({ error: "User not found for this token" })
    });
};