import { UserRepository } from "../repositories/user.repository.js";
import { Result } from "@carbonteq/fp";

const repo = new UserRepository();

export class AuthService {

    static async verifyToken(userId: string): Promise<Result<any, string>> {
        return Result.Ok(userId)
            .flatMap(async(userId) => {
                return await repo.findById(userId)}
            ).mapErr((err) => {
                console.error(`User not found: ${err}`);
                return err;
            })
            .toPromise();
    }
}