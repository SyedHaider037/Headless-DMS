import { db } from "../db";
import { users } from "../schemas/user.schema";
import { roles } from "../schemas/role.schema";
import { eq, or, and } from "drizzle-orm";
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken } from "../utils/jwtTokenAndBcrypt";
import jwt from "jsonwebtoken";

export class UserService {

    async register(username: string, email: string, password: string, role: string): Promise<any> {

        const [existingUser] = await db
            .select()
            .from(users)
            .where(or(
                eq(users.username ,username),
                eq(users.email,email))
            )
        if (existingUser) {
            throw new Error("User with this email or username already exists");
        }    

        const hashedPassword = await hashPassword(password);
        
        const [roleRecord] = await db
            .select()
            .from(roles)
            .where(eq(roles.name, role))
        
        if(!roleRecord.id) {
            throw new Error("Invalid role provided");
        }   
        
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
            throw new Error("Failed to create user");
        }

        return createdUser;
    };

    async login(email: string, password: string): Promise<any> {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        
        if (!user) {
            throw new Error("User not found");
        }

        const isPasswordValid = await verifyPassword(password, user.password);
        
        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }

        const accessToken = generateAccessToken({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.roleId
        });

        const refreshToken = generateRefreshToken({ id: user.id });

        const [updatedUser] = await db.update(users)
            .set({ refreshToken })
            .where(eq(users.id, user.id))
            .returning();

        if (!updatedUser) {
            throw new Error("Failed to update user with refresh token");
        }

        const {password: _password, refreshToken: _refreshToken, ...userData} = updatedUser;

        return { userData, accessToken, refreshToken };
    };

    async logout(userId: string): Promise<any> {

        const [user] = await db
            .update(users)
            .set({ refreshToken: null })
            .where(eq(users.id, userId))
            .returning({
                username:users.username,
                email: users.email,
            });

        if (!user) {
            throw new Error("User not found or already logged out");
        }

        console.log("User logged out successfully:", user);
        return user; 
    };
    
    async refreshToken(oldRefreshToken: string): Promise<any> {       
        
        let decoded;
        try {
            decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET!) as { id: string };
        } catch (error: any) {
            if (error.name === "TokenExpiredError") {
                throw new Error("Refresh token expired");
            }
            throw new Error("Invalid refresh token");
        }

        if (!decoded?.id) {
            throw new Error("Invalid token payload");
        }
        const [user] = await db
            .select()
            .from(users)
            .where(and(
                eq(users.id, decoded.id),
                eq(users.refreshToken, oldRefreshToken)
            ));
        
        if (!user) {
            throw new Error("User not found or invalid refresh token");
        }
        const newAccessToken = generateAccessToken({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.roleId,
        })
        const newRefreshToken = generateRefreshToken({ id: user.id });  
        await db.update(users)
            .set({ refreshToken: newRefreshToken })
            .where(eq(users.id, user.id));
        
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };    
    };    
}
