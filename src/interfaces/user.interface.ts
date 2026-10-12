import { Result } from "@carbonteq/fp";

import { AppError } from "../errors/app-error.js";
export interface IUserRepository {
    findByEmailOrUsername(email: string, username: string): Promise<Result<any, AppError>>;
    findRoleByName(roleName: string): Promise<Result<any, AppError>>;
    createUser(data: { username: string; email: string; password: string; roleId: string}): Promise<Result<any, AppError>>;
    findByEmail(email: string): Promise<Result<any, AppError>>;
    updateRefreshToken(userId: string, refreshToken: string | null): Promise<Result<any, AppError>>;
    findByIdAndToken(userId: string, refreshToken: string): Promise<Result<any, AppError>>;
    findById(userId: string) : Promise<Result<any, AppError>>;
}