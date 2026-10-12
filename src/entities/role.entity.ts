import { randomUUID } from "node:crypto";
import { Result } from "@carbonteq/fp";
import { AppError, validation } from "../errors/app-error.js";

export const ROLE_ADMIN = "ADMIN";
export const ROLE_USER = "USER";

export interface RoleProps {
    id: string;
    name: string;
    createdAt: Date;
}

const NAME_MAX = 50;

export class Role {
    private constructor(private readonly props: RoleProps) {}

    static create(input: { name: string }): Result<Role, AppError> {
        const name = input.name.trim();
        if (!name) return Result.Err(validation("Role name is required"));
        if (name.length > NAME_MAX) return Result.Err(validation(`Role name must be at most ${NAME_MAX} characters long`));
        return Result.Ok(new Role({ id: randomUUID(), name, createdAt: new Date() }));
    }

    static fromPersistence(props: RoleProps): Role {
        return new Role({ ...props });
    }

    get id(): string { return this.props.id; }
    get name(): string { return this.props.name; }
    get createdAt(): Date { return this.props.createdAt; }

    isAdmin(): boolean {
        return this.props.name === ROLE_ADMIN;
    }

    toPersistence(): RoleProps {
        return { ...this.props };
    }
}
