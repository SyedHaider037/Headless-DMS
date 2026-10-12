import { db } from "../db/index.js";
import { users } from "../schemas/user.schema.js";
import { roles } from "../schemas/role.schema.js";
import { eq, or, and } from "drizzle-orm";
import { IUserRepository } from "../interfaces/user.interface.js" 
import { Result } from "@carbonteq/fp";

import { AppError, internal, notFound } from "../errors/app-error.js";
export class UserRepository implements IUserRepository {
    
    async findByEmailOrUsername(email: string, username: string): Promise<Result<any, AppError>> {
        try {
            const [user] = await db
                .select()
                .from(users)
                .where(or(
                    eq(users.username, username),
                    eq(users.email, email))
                );
            return user ? Result.Ok(user) : Result.Err(notFound("User not found"));
        } catch (err) {
            return Result.Err(internal("Failed to fetch user"))
        }
    }

    async findRoleByName(roleName: string): Promise<Result<any, AppError>> {
        try {
            const [roleRecord] = await db
                .select()
                .from(roles)
                .where(eq(roles.name, roleName));
            return roleRecord ? Result.Ok(roleRecord) : Result.Err(notFound("Role not found"));
        } catch (err) {
            return Result.Err(internal("Failed to fetch role"))
        }
    }

    async createUser(data: { username: string; email: string; password: string; roleId: string }): Promise<Result<any, AppError>> {
        try {
            const [createdUser] = await db
                .insert(users)
                .values({
                    ...data,
                    createdAt: new Date(),
                })
                .returning({
                    id: users.id,
                    username: users.username,
                    email: users.email,
                    createdAt: users.createdAt,
                });
            return createdUser ? Result.Ok(createdUser) : Result.Err(internal("Failed to create user"));
        } catch (err) {
            return Result.Err(internal("Failed to create user"));
        }
    }

    async findByEmail(email: string): Promise<Result<any, AppError>> {
        try {
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, email));
            return user ? Result.Ok(user) : Result.Err(notFound("User not found"));
        } catch (err) {
            return Result.Err(internal("Failed to fetch user"));
        }
    }

    async updateRefreshToken(userId: string, refreshToken: string | null): Promise<Result<any, AppError>> {
        try {
            const [updatedUser] = await db 
                .update(users)
                .set({ refreshToken })
                .where(eq(users.id, userId))
                .returning();
            return updatedUser ? Result.Ok(updatedUser) : Result.Err(notFound("User not found"));
        } catch (err) {
            return Result.Err(internal("Failed to update refresh token"));
        }
    }

    async findByIdAndToken(userId: string, refreshToken: string): Promise<Result<any, AppError>> {
        try {
            const [user] = await db
                .select()
                .from(users)
                .where(and(
                    eq(users.id, userId),
                    eq(users.refreshToken, refreshToken)
                ));
            return user ? Result.Ok(user) : Result.Err(notFound("User not found"));
        } catch (err) {
            return Result.Err(internal("Failed to fetch user"));
        }
    }

    async findById(userId: string): Promise<Result<any, AppError>> {
        try {
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId));
            return user ? Result.Ok(user) : Result.Err(notFound("User not found"));
        } catch (err) {
            return Result.Err(internal("Failed to fetch user"));
        }
    }
}