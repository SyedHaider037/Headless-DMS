import { IUserRepository } from "../interfaces/user.interface.js";
import { Result } from "@carbonteq/fp";
import { ILogger } from "../interfaces/logger.interface.js";

export class AuthService {
    constructor(private readonly repo: IUserRepository, private readonly logger: ILogger){}

    async verifyToken(userId: string): Promise<Result<any, string>> {
        return Result.Ok(userId)
            .flatMap(async(userId) => {
                return await this.repo.findById(userId)}
            ).mapErr((err) => {
                this.logger.warn("Token user lookup failed", { error: err });
                return err;
            })
            .toPromise();
    }
}
