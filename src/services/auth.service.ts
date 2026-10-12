import { IUserRepository } from "../interfaces/user.interface.js";
import { Result } from "@carbonteq/fp";

export class AuthService {
    constructor(private readonly repo: IUserRepository){}

    async verifyToken(userId: string): Promise<Result<any, string>> {
        return Result.Ok(userId)
            .flatMap(async(userId) => {
                return await this.repo.findById(userId)}
            ).mapErr((err) => {
                console.error(`User not found: ${err}`);
                return err;
            })
            .toPromise();
    }
}
