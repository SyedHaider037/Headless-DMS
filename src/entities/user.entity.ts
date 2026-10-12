import { randomUUID } from "node:crypto";
import { Result } from "@carbonteq/fp";
import { AppError, validation } from "../errors/app-error.js";

// the persisted shape of a user, including the password hash and the refresh token
export interface UserProps {
    id: string;
    username: string;
    email: string;
    password: string;
    roleId: string;
    refreshToken: string | null;
    createdAt: Date;
}

// a user without the password hash and refresh token: safe for req.user and responses
export interface AuthenticatedUser {
    id: string;
    username: string;
    email: string;
    roleId: string;
    createdAt: Date;
}

// what registration answers with
export interface UserSummary {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
}

const USERNAME_MIN = 8;
const FIELD_MAX = 255;

export interface CreateUserInput {
    username: string;
    email: string;
    // already hashed: hashing is not the entity's job
    passwordHash: string;
    roleId: string;
}

export class User {
    private constructor(private readonly props: UserProps) {}

    static create(input: CreateUserInput): Result<User, AppError> {
        const username = input.username.trim();
        if (username.length < USERNAME_MIN) return Result.Err(validation(`Username must be at least ${USERNAME_MIN} characters long`));
        if (username.length > FIELD_MAX) return Result.Err(validation(`Username must be at most ${FIELD_MAX} characters long`));
        const email = input.email.trim();
        if (!email) return Result.Err(validation("Email is required"));
        if (email.length > FIELD_MAX) return Result.Err(validation(`Email must be at most ${FIELD_MAX} characters long`));
        if (!input.passwordHash) return Result.Err(validation("Password hash is required"));
        if (!input.roleId.trim()) return Result.Err(validation("Role is required"));

        return Result.Ok(new User({
            id: randomUUID(),
            username,
            email,
            password: input.passwordHash,
            roleId: input.roleId,
            refreshToken: null,
            createdAt: new Date(),
        }));
    }

    static fromPersistence(props: UserProps): User {
        return new User({ ...props });
    }

    get id(): string { return this.props.id; }
    get username(): string { return this.props.username; }
    get email(): string { return this.props.email; }
    get roleId(): string { return this.props.roleId; }
    get createdAt(): Date { return this.props.createdAt; }
    get passwordHash(): string { return this.props.password; }
    get refreshToken(): string | null { return this.props.refreshToken; }

    assignRefreshToken(token: string | null): Result<User, AppError> {
        if (token !== null && !token.trim()) return Result.Err(validation("Refresh token must not be empty"));
        this.props.refreshToken = token;
        return Result.Ok(this);
    }

    // never includes the password hash or the refresh token
    toAuthenticated(): AuthenticatedUser {
        const { id, username, email, roleId, createdAt } = this.props;
        return { id, username, email, roleId, createdAt };
    }

    toSummary(): UserSummary {
        const { id, username, email, createdAt } = this.props;
        return { id, username, email, createdAt };
    }

    toPersistence(): UserProps {
        return { ...this.props };
    }
}
