import { Result } from "@carbonteq/fp";

import { AppError } from "../errors/app-error.js";
import { AuthenticatedUser, CreatedUser, NewUser, UserProps } from "../entities/user.entity.js";
import { RoleProps } from "../entities/role.entity.js";
export interface IUserRepository {
    findByEmailOrUsername(email: string, username: string): Promise<Result<UserProps, AppError>>;
    findRoleByName(roleName: string): Promise<Result<RoleProps, AppError>>;
    save(data: NewUser): Promise<Result<CreatedUser, AppError>>;
    findByEmail(email: string): Promise<Result<UserProps, AppError>>;
    updateRefreshToken(userId: string, refreshToken: string | null): Promise<Result<UserProps, AppError>>;
    findByIdAndToken(userId: string, refreshToken: string): Promise<Result<UserProps, AppError>>;
    findById(userId: string) : Promise<Result<UserProps, AppError>>;
}