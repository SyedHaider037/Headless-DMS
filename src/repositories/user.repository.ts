import { db } from "../db/index.js";
import { users } from "../schemas/user.schema.js";
import { roles } from "../schemas/role.schema.js";
import { eq, or, and } from "drizzle-orm";
import { IUserRepository } from "../interfaces/user.interface.js" 
import { Result } from "@carbonteq/fp";

export class UserRepository implements IUserRepository {
    
    async findByEmailOrUsername(email: string, username: string): Promise<Result<any, string>> {
        try {
            const [user] = await db
                .select()
                .from(users)
                .where(or(
                    eq(users.username, username),
                    eq(users.email, email))
                );
            return user ? Result.Ok(user) : Result.Err("User not found with the given email or username");
        } catch (err) {
            return Result.Err("Failed to fetch user by email or username")
        }
    }

    async findRoleByName(roleName: string): Promise<Result<any, string>> {
        try {
            const [roleRecord] = await db
                .select()
                .from(roles)
                .where(eq(roles.name, roleName));
            return roleRecord ? Result.Ok(roleRecord) : Result.Err("Role not found");
        } catch (err) {
            return Result.Err("Failed to fetch role by name")
        }
    }

    async createUser(data: { username: string; email: string; password: string; roleId: string }): Promise<Result<any, string>> {
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
            return createdUser ? Result.Ok(createdUser) : Result.Err("User not created");
        } catch (err) {
            return Result.Err("Failed to insert user in database");
        }
    }

    async findByEmail(email: string): Promise<Result<any, string>> {
        try {
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, email));
            return user ? Result.Ok(user) : Result.Err("User not found with the given email");
        } catch (err) {
            return Result.Err("Failed to fetch user by email");
        }
    }

    async updateRefreshToken(userId: string, refreshToken: string | null): Promise<Result<any, string>> {
        try {
            const [updatedUser] = await db 
                .update(users)
                .set({ refreshToken })
                .where(eq(users.id, userId))
                .returning();
            return updatedUser ? Result.Ok(updatedUser) : Result.Err("Failed to update refresh token");
        } catch (err) {
            return Result.Err("Error while updateing refresh token");
        }
    }

    async findByIdAndToken(userId: string, refreshToken: string): Promise<Result<any, string>> {
        try {
            const [user] = await db
                .select()
                .from(users)
                .where(and(
                    eq(users.id, userId),
                    eq(users.refreshToken, refreshToken)
                ));
            return user ? Result.Ok(user) : Result.Err("User not found with given id and refresh token");
        } catch (err) {
            return Result.Err("Failed to fetch user by id and refresh token");
        }
    }

    async findById(userId: string): Promise<Result<any, string>> {
        try {
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId));
            return user ? Result.Ok(user) : Result.Err("User not found with the given id");
        } catch (err) {
            return Result.Err("Failed to fetch user by id");
        }
    }
}