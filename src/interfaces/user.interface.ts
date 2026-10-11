import { Result } from "@carbonteq/fp";

export interface IUserRepository {
    findByEmailOrUsername(email: string, username: string): Promise<Result<any, string>>;
    findRoleByName(roleName: string): Promise<Result<any, string>>;
    createUser(data: { username: string; email: string; password: string; roleId: string}): Promise<Result<any, string>>;
    findByEmail(email: string): Promise<Result<any, string>>;
    updateRefreshToken(userId: string, refreshToken: string | null): Promise<Result<any, string>>;
    findByIdAndToken(userId: string, refreshToken: string): Promise<Result<any, string>>;
    findById(userId: string) : Promise<Result<any, string>>;
}