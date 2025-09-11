import { db } from "../db/index";
import { users } from "../schemas/user.schema";
import { roles } from "../schemas/role.schema";
import { eq, or, and } from "drizzle-orm";

export class UserRepository {
    
    async findByEmailOrUsername(email: string, username: string): Promise<any> {
        const [user] = await db
            .select()
            .from(users)
            .where(or(
                eq(users.username, username),
                eq(users.email, email))
            );
        return user;
    }

    async findRoleByName(roleName: string): Promise<any> {
        const [roleRecord] = await db
            .select()
            .from(roles)
            .where(eq(roles.name, roleName));
        return roleRecord;
    }

    async createUser(data: { username: string; email: string; password: string; roleId: string }): Promise<any> {
        const createdUser = await db
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
        return createdUser;
    }

    async findByEmail(email: string): Promise<any> {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        return user;
    }

    async updateRefreshToken(userId: string, refreshToken: string | null): Promise<any> {
        const [updatedUser] = await db 
            .update(users)
            .set({ refreshToken })
            .where(eq(users.id, userId))
            .returning();
        return updatedUser;
    }

    async findByIdAndToken(userId: string, refreshToken: string): Promise<any> {
        const [user] = await db
            .select()
            .from(users)
            .where(and(
                eq(users.id, userId),
                eq(users.refreshToken, refreshToken)
            ));
        return user;
    }
}