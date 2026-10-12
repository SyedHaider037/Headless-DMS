import { Result } from "@carbonteq/fp";
import { AuthCredentials, IAuthHandler } from "../interfaces/auth-handler.interface.js";
import { ITokenService } from "../interfaces/token.interface.js";
import { AuthService } from "../services/auth.service.js";
import { AppError, unauthorized } from "../errors/app-error.js";
import { AuthenticatedUser } from "../entities/user.entity.js";

// authenticates a request from an access token: verify it, then load the user it names
export class JwtAuthHandler implements IAuthHandler {
    constructor(private readonly tokens: ITokenService, private readonly authService: AuthService) {}

    async authenticate({ token }: AuthCredentials): Promise<Result<AuthenticatedUser, AppError>> {
        if (!token) return Result.Err(unauthorized("No token provided"));

        const verified = this.tokens.verifyAccessToken(token);
        if (verified.isErr()) return Result.Err(verified.unwrapErr());

        return await this.authService.verifyToken(verified.unwrap().userId);
    }
}
