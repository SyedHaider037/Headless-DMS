import { Result } from "@carbonteq/fp";
import { AppError } from "../errors/app-error.js";
import { User } from "../entities/user.entity.js";
import { Role } from "../entities/role.entity.js";

export interface IUserRepository {
    findByEmailOrUsername(email: string, username: string): Promise<Result<User, AppError>>;
    findRoleByName(roleName: string): Promise<Result<Role, AppError>>;
    // inserts a new user; the entity already carries its application-generated id
    save(user: User): Promise<Result<User, AppError>>;
    // persists the changes made to an existing user (the refresh token)
    update(user: User): Promise<Result<User, AppError>>;
    findByEmail(email: string): Promise<Result<User, AppError>>;
    findByIdAndToken(userId: string, refreshToken: string): Promise<Result<User, AppError>>;
    findById(userId: string): Promise<Result<User, AppError>>;
}
