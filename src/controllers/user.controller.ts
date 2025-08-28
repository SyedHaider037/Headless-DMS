import { Request, Response } from "express";
import { registerSchema, loginSchema } from "../validation/user.validation";
import { hashPassword, verifyPassword , generateAccessToken, generateRefreshToken } from "../utils/jwtTokenAndBcrypt";
import { eq, or } from "drizzle-orm";
import { db } from "../db/index";
import { users } from "../schemas/user.schema";
import { roles } from "../schemas/role.schema";
import jwt  from "jsonwebtoken";

const options = {
    httpOnly : true,
    secure : true,
    sameSite: 'strict' as const,
    maxAge: 5 * 24 * 60 * 60 * 1000,
}

export const RegisterUser = async (req: Request, res: Response ) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        
        if (!parsed.success) {
            return res.status(400).json({ error: "Validation failed", details: parsed.error.issues});
        }

        const {username, email, password, role} = parsed.data;

        const [existingUser] = await db
            .select()
            .from(users)
            .where(or(
                eq(users.username ,username),
                eq(users.email,email))
        );

        if (existingUser) {
            return res.status(400).json({ error: "User with this email or username already exists" });
        
        }

        const hashedPassword = await hashPassword(password);

        const [roleRecord] = await db
            .select()
            .from(roles)
            .where(eq(roles.name, role))
        
        const createdUser = await db.insert(users).values({
            username,
            email,
            password: hashedPassword,
            roleId: roleRecord.id,
        })
        .returning({
            id: users.id,
            username: users.username,
            email: users.email,
            createdAt: users.createdAt,
        })

        if (!createdUser) {
            return res.status(500).json({ error: "Failed to create user" });
        }
            
        return res.status(201).json({ user : {createdUser, role} , message: "User registered successfully"});
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }

}


export const loginUser = async (req: Request, res: Response) => {
    try {
        const parsed = loginSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: "Validation failed",  details: parsed.error.issues});
        }

        const { email, password } = parsed.data;

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const accessToken = generateAccessToken({ 
            id: user.id,
            email: user.email,
            password: user.password,
        });

        const refreshToken = generateRefreshToken({ id: user.id });

        const [updatedUser] = await db
            .update(users)
            .set({ refreshToken: refreshToken })
            .where(eq(users.id, user.id))
            .returning();

        const { password: _password, refreshToken: _refreshToken, ...userData } = updatedUser; 

        console.log("User logged in successfully:", userData);
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)  
            .json({
                user: userData,
                accessToken: accessToken,
                refreshToken: refreshToken, 
                message: "User logged in successfully"
            });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const logoutUser = async(req: Request, res: Response) => {
    const token = req.cookies.refreshToken;

    try {
        if (!token) {
            return res.status(400).json({ error: "No token provoided"});
        }

        const [user] = await db
            .update(users)
            .set({ refreshToken: null })
            .where(eq(users.refreshToken, token))
            .returning({
                id: users.id,
                username: users.username,
                email: users.email,
            });  
            
        return res.status(200)
                .clearCookie("accessToken", options)
                .clearCookie("refreshToken", options)
                .json({ LogOutUser: user ,message :"User logged out successfully"})
            
    } catch (error) {
        
    }

    
}

export const refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token provided" });
    } 

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as { id: string };

        if (!decoded?.id) {
            return res.status(403).json({ error: "Invalid token payload" });
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, decoded.id));

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const newAccessToken = generateAccessToken({ 
            id: user.id, 
            email: user.email,
            username: user.username,
        });

        const newRefreshToken = generateRefreshToken({ id: user.id });

        await db.update(users)
            .set({ refreshToken: newRefreshToken })
            .where(eq(users.id, user.id));

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json({ 
                accessToken: newAccessToken, 
                message: "Access token refreshed successfully" 
            });

    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            return res.status(403).json({ error: "Invalid or expired refresh token" });
        }
        return res.status(500).json({ error: "Internal server error" });
    }
};
