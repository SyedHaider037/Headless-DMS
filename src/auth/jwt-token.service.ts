import { randomUUID } from "node:crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { Result } from "@carbonteq/fp";
import { AccessTokenClaims, ITokenService } from "../interfaces/token.interface.js";
import { AppError, unauthorized } from "../errors/app-error.js";

export interface TokenSettings {
    secret: string;
    expiry: string;
}

export interface JwtTokenSettings {
    access: TokenSettings;
    refresh: TokenSettings;
    download: TokenSettings;
}

// the only place (besides the hasher) that knows tokens are JWTs
export class JwtTokenService implements ITokenService {
    constructor(private readonly settings: JwtTokenSettings) {}

    createAccessToken(claims: AccessTokenClaims): string {
        return this.sign({ ...claims }, this.settings.access);
    }

    // the jti makes each refresh token unique, so a used token can never equal the new one
    createRefreshToken(userId: string): string {
        return this.sign({ id: userId, jti: randomUUID() }, this.settings.refresh);
    }

    createDownloadToken(documentId: string): string {
        return this.sign({ documentId }, this.settings.download);
    }

    verifyAccessToken(token: string): Result<{ userId: string }, AppError> {
        return this.verify(token, this.settings.access, "access token").flatMap((payload) =>
            typeof payload.id === "string" && payload.id
                ? Result.Ok({ userId: payload.id })
                : Result.Err(unauthorized("Invalid access token payload")));
    }

    verifyRefreshToken(token: string): Result<{ userId: string }, AppError> {
        return this.verify(token, this.settings.refresh, "refresh token").flatMap((payload) =>
            typeof payload.id === "string" && payload.id
                ? Result.Ok({ userId: payload.id })
                : Result.Err(unauthorized("Invalid refresh token payload")));
    }

    verifyDownloadToken(token: string): Result<{ documentId: string }, AppError> {
        return this.verify(token, this.settings.download, "download token").flatMap((payload) =>
            typeof payload.documentId === "string" && payload.documentId
                ? Result.Ok({ documentId: payload.documentId })
                : Result.Err(unauthorized("Invalid download token payload")));
    }

    private sign(payload: object, { secret, expiry }: TokenSettings): string {
        return jwt.sign(payload, secret, { expiresIn: expiry as SignOptions["expiresIn"] });
    }

    private verify(token: string, { secret }: TokenSettings, label: string): Result<Record<string, unknown>, AppError> {
        try {
            const decoded = jwt.verify(token, secret);
            if (typeof decoded === "string") return Result.Err(unauthorized(`Invalid ${label} payload`));
            return Result.Ok(decoded as Record<string, unknown>);
        } catch (error: any) {
            const capitalised = label.charAt(0).toUpperCase() + label.slice(1);
            return Result.Err(unauthorized(error?.name === "TokenExpiredError" ? `${capitalised} expired` : `Invalid ${label}`));
        }
    }
}
