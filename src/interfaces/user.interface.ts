import { Result } from "@carbonteq/fp";

import { AppError } from "../errors/app-error.js";
import { AuthenticatedUser, CreatedUser, NewUser, Role, User } from "../entities/user.entity.js";
export interface IUserRepository {
    findByEmailOrUsername(email: string, username: string): Promise<Result<User, AppError>>;
    findRoleByName(roleName: string): Promise<Result<Role, AppError>>;
    save(data: NewUser): Promise<Result<CreatedUser, AppError>>;
    findByEmail(email: string): Promise<Result<User, AppError>>;
    updateRefreshToken(userId: string, refreshToken: string | null): Promise<Result<User, AppError>>;
    findByIdAndToken(userId: string, refreshToken: string): Promise<Result<User, AppError>>;
    findById(userId: string) : Promise<Result<User, AppError>>;
}