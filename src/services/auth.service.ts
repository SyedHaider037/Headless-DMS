import { IUserRepository } from "../interfaces/user.interface.js";
import { Result } from "@carbonteq/fp";
import { ILogger } from "../interfaces/logger.interface.js";

import { AppError, unauthorized } from "../errors/app-error.js";
export class AuthService {
    constructor(private readonly repo: IUserRepository, private readonly logger: ILogger){}

    async verifyToken(userId: string): Promise<Result<any, AppError>> {
        return Result.Ok(userId)
            .flatMap(async(userId) => {
                return await this.repo.findById(userId)}
            ).mapErr((err) => err.kind === "NotFound" ? unauthorized("User not found for this token") : err)
            .mapErr((err) => {
                this.logger.warn("Token user lookup failed", { error: err.message });
                return err;
            })
            .toPromise();
    }
}
