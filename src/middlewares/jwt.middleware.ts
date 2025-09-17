import { NextFunction, Request, Response } from "express";  
import { users } from "../schemas/user.schema";
import { AuthService } from "../services/auth.service";

declare global {
    namespace Express {
        interface Request {
            user?: typeof users.$inferSelect; 
        }
    }
}       

export const verifyAuthToken = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    
    try {
        const user = await AuthService.verifyToken(token);
        req.user = user;
        next();
    } catch (error: any) {
        return res.status(401).json({error: error.message});
    } 
};