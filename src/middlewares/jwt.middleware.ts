import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";  
import { db } from "../db/index";
import { users } from "../schemas/user.schema";
import { eq } from "drizzle-orm";      

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
            return res.status(401).json({ error: "Token expired" });
        }
        return res.status(403).json({ error: "Invalid token" });
    }

    if (!decoded?.id) {
        return res.status(403).json({ error: "Invalid token payload" });
    }

    const [user]= await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.id));
    
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }   

    req.user = user;
    next(); 
}