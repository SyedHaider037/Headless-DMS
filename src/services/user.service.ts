import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken } from "../utils/jwtTokenAndBcrypt.js";
import { RegisterUserDTO, LoginUserDTO } from "../dtos/user.dto.js";
import { IUserRepository } from "../interfaces/user.interface.js";
import { Result } from "@carbonteq/fp";
import { ILogger } from "../interfaces/logger.interface.js";

import { AppError, conflict, internal, unauthorized } from "../errors/app-error.js";
import { AuthenticatedUser, CreatedUser } from "../entities/user.entity.js";
export class UserService {
    constructor(private readonly repo: IUserRepository, private readonly logger: ILogger){}

    async register(data: RegisterUserDTO): Promise<Result<CreatedUser, AppError>> {
        const { username, email, password } = data;

        return Result.Ok({email, username})
            .flatMap( async() => {
                const userExist = await this.repo.findByEmailOrUsername(email, username);
                if (userExist.isOk()) return Result.Err(conflict("User with this email or username already exists"));
                // "not found" is the expected case here; any other error is a real failure
                return userExist.unwrapErr().kind === "NotFound" ? Result.Ok(password) : Result.Err(userExist.unwrapErr());
            })
            .flatMap( async() => {
                const hashedPassword = await hashPassword(password);
                return Result.Ok(hashedPassword);
            })
            .flatMap( async(hashedPassword) => {
                const roleRecord = await this.repo.findRoleByName("USER");
                return roleRecord
                    .mapErr((err) => err.kind === "NotFound" ? internal("Default role USER is missing; run the seeder") : err)
                    .map((roleRecord) => ({hashedPassword, roleRecord}));
            })
            .flatMap( async({hashedPassword, roleRecord}) => await this.repo.save({
                username,
                email,
                password: hashedPassword,
                roleId: roleRecord.id
            }))
            .mapErr((err) => {
                this.logger.warn("User registration failed", { error: err.message });
                return err;
            })
            .toPromise();
    };

    async login(data: LoginUserDTO): Promise<Result<{ userData: AuthenticatedUser, accessToken: string, refreshToken: string }, AppError>> {
        const { email, password } = data;

        return Result.Ok(email)
            .flatMap( async() => {
                const found = await this.repo.findByEmail(email);
                return found.mapErr((err) => err.kind === "NotFound" ? unauthorized("Invalid email or password") : err);
            })
            .flatMap( async(user) => {
                const isPasswordValid = await verifyPassword(password, user.password);
                return isPasswordValid ? Result.Ok(user) : Result.Err(unauthorized("Invalid email or password"));
            })
            .flatMap( async(user) => {
                const accessToken = generateAccessToken({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.roleId
                });
                const refreshToken = generateRefreshToken({ id: user.id });

                const updatedUser = await this.repo.updateRefreshToken(user.id, refreshToken);
                return updatedUser.map((updated) => {
                    const {password: _password, refreshToken: _refreshToken, ...userData} = updated;
                    return { userData, accessToken, refreshToken };
                });
            })
            .mapErr((err) => {
                this.logger.warn("User login failed", { error: err.message });
                return err;
            })
            .toPromise();
    };

    async logout(userId: string): Promise<Result<void, AppError>> {

        return Result.Ok(userId)
            .flatMap( async() => {
                const updated = await this.repo.updateRefreshToken(userId, null);
                return updated.map(() => undefined);
            })
            .mapErr((err) => {
                this.logger.warn("User logout failed", { userId, error: err.message });
                return err;
            })
            .toPromise();
    };

    async refreshToken(userId: string, oldRefreshToken: string): Promise<Result<{ accessToken: string, refreshToken: string }, AppError>> {

        return Result.Ok({userId, oldRefreshToken})
            .flatMap(async() => {
                const found = await this.repo.findByIdAndToken(userId, oldRefreshToken);
                return found.mapErr((err) => err.kind === "NotFound" ? unauthorized("Invalid refresh token") : err);
            })
            .flatMap(async(user) => {
                const newAccessToken = generateAccessToken({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.roleId,
                })
                const newRefreshToken = generateRefreshToken({ id: user.id });

                const updated = await this.repo.updateRefreshToken(user.id, newRefreshToken);
                return updated.map(() => ({accessToken: newAccessToken, refreshToken: newRefreshToken}));
            })
            .mapErr((err) => {
                this.logger.warn("Token refresh failed", { userId, error: err.message });
                return err;
            })
            .toPromise();
    }
}