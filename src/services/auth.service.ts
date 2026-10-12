import { IUserRepository } from "../interfaces/user.interface.js";
import { Result } from "@carbonteq/fp";
import { ILogger } from "../interfaces/logger.interface.js";

import { AppError, unauthorized } from "../errors/app-error.js";
import { AuthenticatedUser } from "../entities/user.entity.js";

export class AuthService {
    constructor(private readonly repo: IUserRepository, private readonly logger: ILogger){}

    async verifyToken(userId: string): Promise<Result<AuthenticatedUser, AppError>> {
        return Result.Ok(userId)
            .flatMap(async(userId) => await this.repo.findById(userId))
            .map((user) => user.toAuthenticated())
            .mapErr((err) => err.kind === "NotFound" ? unauthorized("User not found for this token") : err)
            .mapErr((err) => {
                this.logger.warn("Token user lookup failed", { error: err.message });
                return err;
            })
            .toPromise();
    }
}
