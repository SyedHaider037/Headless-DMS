import { Result } from "@carbonteq/fp";
import { AppError } from "../errors/app-error.js";

// what an access token carries about the user
export interface AccessTokenClaims {
    id: string;
    username: string;
    email: string;
    role: string;
}

// creates and verifies the three kinds of token; callers never see how they are signed
export interface ITokenService {
    createAccessToken(claims: AccessTokenClaims): string;
    // every refresh token is unique, even two created in the same second
    createRefreshToken(userId: string): string;
    createDownloadToken(documentId: string): string;
    verifyAccessToken(token: string): Result<{ userId: string }, AppError>;
    verifyRefreshToken(token: string): Result<{ userId: string }, AppError>;
    verifyDownloadToken(token: string): Result<{ documentId: string }, AppError>;
}
