import { Result } from "@carbonteq/fp";
import { AppError } from "../errors/app-error.js";
import { AuthenticatedUser } from "../entities/user.entity.js";

// the credential the transport layer found on the request (here: the raw access token)
export interface AuthCredentials {
    token?: string;
}

// the auth middleware depends only on this; JWT is just one way to implement it
export interface IAuthHandler {
    authenticate(credentials: AuthCredentials): Promise<Result<AuthenticatedUser, AppError>>;
}
