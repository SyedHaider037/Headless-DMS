import { Result } from "@carbonteq/fp";
import { IUserRepository } from "../../interfaces/user.interface.js";
import { IPasswordHasher } from "../../interfaces/password-hasher.interface.js";
import { ILogger } from "../../interfaces/logger.interface.js";
import { AppError } from "../../errors/app-error.js";
import { ROLE_ADMIN } from "../../entities/role.entity.js";
import { User } from "../../entities/user.entity.js";

export interface AdminSeedSettings {
    admin: { username: string; email: string; password: string } | null;
    // names of the ADMIN_ variables that are missing or invalid
    problems: string[];
}

export type AdminSeedOutcome = "created" | "already-exists" | "not-configured";

// creates the first ADMIN user; safe to run again: an existing account is never touched
export const seedAdminUser = async (
    { admin, problems }: AdminSeedSettings,
    deps: { users: IUserRepository; hasher: IPasswordHasher; logger: ILogger },
): Promise<Result<AdminSeedOutcome, AppError>> => {
    const { users, hasher, logger } = deps;

    if (!admin) {
        logger.warn("Admin user not seeded. Set valid values for these variables to create one", { variables: problems });
        return Result.Ok("not-configured");
    }

    const existing = await users.findByEmailOrUsername(admin.email, admin.username);
    if (existing.isOk()) {
        const sameEmail = existing.unwrap().email === admin.email;
        logger.info("Admin user not created: the account already exists and was left unchanged", {
            reason: sameEmail ? "email already registered" : "username already taken",
        });
        return Result.Ok("already-exists");
    }
    if (existing.unwrapErr().kind !== "NotFound") return Result.Err(existing.unwrapErr());

    const role = await users.findRoleByName(ROLE_ADMIN);
    if (role.isErr()) return Result.Err(role.unwrapErr());

    const passwordHash = await hasher.hash(admin.password);
    const user = User.create({ username: admin.username, email: admin.email, passwordHash, roleId: role.unwrap().id });
    if (user.isErr()) return Result.Err(user.unwrapErr());

    const saved = await users.save(user.unwrap());
    if (saved.isErr()) return Result.Err(saved.unwrapErr());

    logger.info("Admin user created", { username: admin.username });
    return Result.Ok("created");
};
