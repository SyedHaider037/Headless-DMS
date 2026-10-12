import { db } from "../db/index.js";
import { users } from "../schemas/user.schema.js";
import { roles } from "../schemas/role.schema.js";
import { eq, or, and } from "drizzle-orm";
import { IUserRepository } from "../interfaces/user.interface.js"
import { Result } from "@carbonteq/fp";

import { AppError, internal, notFound } from "../errors/app-error.js";
import { User } from "../entities/user.entity.js";
import { Role } from "../entities/role.entity.js";

// rows are mapped to entities here and nowhere else
const toEntity = (row: typeof users.$inferSelect): User => User.fromPersistence(row);

export class UserRepository implements IUserRepository {

    async findByEmailOrUsername(email: string, username: string): Promise<Result<User, AppError>> {
        try {
            const [row] = await db
                .select()
                .from(users)
                .where(or(
                    eq(users.username, username),
                    eq(users.email, email))
                );
            return row ? Result.Ok(toEntity(row)) : Result.Err(notFound("User not found"));
        } catch (err) {
            return Result.Err(internal("Failed to fetch user"))
        }
    }

    async findRoleByName(roleName: string): Promise<Result<Role, AppError>> {
        try {
            const [row] = await db
                .select()
                .from(roles)
                .where(eq(roles.name, roleName));
            return row ? Result.Ok(Role.fromPersistence(row)) : Result.Err(notFound("Role not found"));
        } catch (err) {
            return Result.Err(internal("Failed to fetch role"))
        }
    }

    async save(user: User): Promise<Result<User, AppError>> {
        try {
            const [row] = await db
                .insert(users)
                .values(user.toPersistence())
                .returning();
            return row ? Result.Ok(toEntity(row)) : Result.Err(internal("Failed to create user"));
        } catch (err) {
            return Result.Err(internal("Failed to create user"));
        }
    }

    async update(user: User): Promise<Result<User, AppError>> {
        try {
            const [row] = await db
                .update(users)
                .set({ refreshToken: user.refreshToken })
                .where(eq(users.id, user.id))
                .returning();
            return row ? Result.Ok(toEntity(row)) : Result.Err(notFound("User not found"));
        } catch (err) {
            return Result.Err(internal("Failed to update user"));
        }
    }

    async findByEmail(email: string): Promise<Result<User, AppError>> {
        try {
            const [row] = await db
                .select()
                .from(users)
                .where(eq(users.email, email));
            return row ? Result.Ok(toEntity(row)) : Result.Err(notFound("User not found"));
        } catch (err) {
            return Result.Err(internal("Failed to fetch user"));
        }
    }

    async findByIdAndToken(userId: string, refreshToken: string): Promise<Result<User, AppError>> {
        try {
            const [row] = await db
                .select()
                .from(users)
                .where(and(
                    eq(users.id, userId),
                    eq(users.refreshToken, refreshToken)
                ));
            return row ? Result.Ok(toEntity(row)) : Result.Err(notFound("User not found"));
        } catch (err) {
            return Result.Err(internal("Failed to fetch user"));
        }
    }

    async findById(userId: string): Promise<Result<User, AppError>> {
        try {
            const [row] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId));
            return row ? Result.Ok(toEntity(row)) : Result.Err(notFound("User not found"));
        } catch (err) {
            return Result.Err(internal("Failed to fetch user"));
        }
    }
}
