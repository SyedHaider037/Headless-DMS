export interface Role {
    id: string;
    name: string;
    createdAt: Date;
}

// full stored user: only repositories and the auth flow should handle this
export interface User {
    id: string;
    username: string;
    email: string;
    password: string;
    roleId: string;
    refreshToken: string | null;
    createdAt: Date;
}

// a user without the password hash and refresh token: safe for req.user and responses
export type AuthenticatedUser = Omit<User, "password" | "refreshToken">;

export interface NewUser {
    username: string;
    email: string;
    password: string;
    roleId: string;
}

export type CreatedUser = Pick<User, "id" | "username" | "email" | "createdAt">;
