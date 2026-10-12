import { RegisterUserDTO, LoginUserDTO } from "../dtos/user.dto.js";
import { IUserRepository } from "../interfaces/user.interface.js";
import { Result } from "@carbonteq/fp";
import { ILogger } from "../interfaces/logger.interface.js";
import { ITokenService } from "../interfaces/token.interface.js";
import { IPasswordHasher } from "../interfaces/password-hasher.interface.js";

import { AppError, conflict, internal, unauthorized, validation } from "../errors/app-error.js";
import { AuthenticatedUser, User, UserSummary } from "../entities/user.entity.js";
import { ROLE_USER } from "../entities/role.entity.js";

const PASSWORD_MIN = 8;

export class UserService {
    constructor(
        private readonly repo: IUserRepository,
        private readonly tokens: ITokenService,
        private readonly hasher: IPasswordHasher,
        private readonly logger: ILogger,
    ){}

    async register(data: RegisterUserDTO): Promise<Result<UserSummary, AppError>> {
        const { username, email, password } = data;

        return Result.Ok({email, username})
            .flatMap( () => password.length >= PASSWORD_MIN
                ? Result.Ok(password)
                : Result.Err(validation(`Password must be at least ${PASSWORD_MIN} characters long`)))
            .flatMap( async() => {
                const userExist = await this.repo.findByEmailOrUsername(email, username);
                if (userExist.isOk()) return Result.Err(conflict("User with this email or username already exists"));
                // "not found" is the expected case here; any other error is a real failure
                return userExist.unwrapErr().kind === "NotFound" ? Result.Ok(password) : Result.Err(userExist.unwrapErr());
            })
            .flatMap( async() => {
                const hashedPassword = await this.hasher.hash(password);
                return Result.Ok(hashedPassword);
            })
            .flatMap( async(hashedPassword) => {
                const roleRecord = await this.repo.findRoleByName(ROLE_USER);
                return roleRecord
                    .mapErr((err) => err.kind === "NotFound" ? internal("Default role USER is missing; run the seeder") : err)
                    .map((roleRecord) => ({hashedPassword, roleRecord}));
            })
            .flatMap( ({hashedPassword, roleRecord}) => User.create({
                username,
                email,
                passwordHash: hashedPassword,
                roleId: roleRecord.id
            }))
            .flatMap( async(user) => await this.repo.save(user))
            .map((user) => user.toSummary())
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
                const isPasswordValid = await this.hasher.compare(password, user.passwordHash);
                return isPasswordValid ? Result.Ok(user) : Result.Err(unauthorized("Invalid email or password"));
            })
            .flatMap( async(user) => {
                const accessToken = this.tokens.createAccessToken({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.roleId
                });
                const refreshToken = this.tokens.createRefreshToken(user.id);

                const withToken = user.assignRefreshToken(refreshToken);
                if (withToken.isErr()) return Result.Err(withToken.unwrapErr());
                const updatedUser = await this.repo.update(withToken.unwrap());
                return updatedUser.map((updated) => ({ userData: updated.toAuthenticated(), accessToken, refreshToken }));
            })
            .mapErr((err) => {
                this.logger.warn("User login failed", { error: err.message });
                return err;
            })
            .toPromise();
    };

    async logout(userId: string): Promise<Result<void, AppError>> {

        return Result.Ok(userId)
            .flatMap( async() => await this.repo.findById(userId))
            .flatMap( (user) => user.assignRefreshToken(null))
            .flatMap( async(user) => await this.repo.update(user))
            .map(() => undefined)
            .mapErr((err) => {
                this.logger.warn("User logout failed", { userId, error: err.message });
                return err;
            })
            .toPromise();
    };

    async refreshToken(oldRefreshToken: string): Promise<Result<{ accessToken: string, refreshToken: string }, AppError>> {

        return this.tokens.verifyRefreshToken(oldRefreshToken)
            .flatMap(async({ userId }) => {
                const found = await this.repo.findByIdAndToken(userId, oldRefreshToken);
                return found.mapErr((err) => err.kind === "NotFound" ? unauthorized("Invalid refresh token") : err);
            })
            .flatMap(async(user) => {
                const newAccessToken = this.tokens.createAccessToken({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.roleId,
                })
                const newRefreshToken = this.tokens.createRefreshToken(user.id);

                const withToken = user.assignRefreshToken(newRefreshToken);
                if (withToken.isErr()) return Result.Err(withToken.unwrapErr());
                const updated = await this.repo.update(withToken.unwrap());
                return updated.map(() => ({accessToken: newAccessToken, refreshToken: newRefreshToken}));
            })
            .mapErr((err) => {
                this.logger.warn("Token refresh failed", { error: err.message });
                return err;
            })
            .toPromise();
    }
}
