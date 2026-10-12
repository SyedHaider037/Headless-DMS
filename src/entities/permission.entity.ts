import { randomUUID } from "node:crypto";
import { Result } from "@carbonteq/fp";
import { AppError, validation } from "../errors/app-error.js";

export interface PermissionProps {
    id: string;
    action: string;
    description: string | null;
    createdAt: Date;
}

const ACTION_MAX = 255;

export class Permission {
    private constructor(private readonly props: PermissionProps) {}

    static create(input: { action: string; description?: string | null }): Result<Permission, AppError> {
        const action = input.action.trim();
        if (!action) return Result.Err(validation("Permission action is required"));
        if (action.length > ACTION_MAX) return Result.Err(validation(`Permission action must be at most ${ACTION_MAX} characters long`));
        return Result.Ok(new Permission({
            id: randomUUID(),
            action,
            description: input.description?.trim() || null,
            createdAt: new Date(),
        }));
    }

    static fromPersistence(props: PermissionProps): Permission {
        return new Permission({ ...props });
    }

    get id(): string { return this.props.id; }
    get action(): string { return this.props.action; }
    get description(): string | null { return this.props.description; }
    get createdAt(): Date { return this.props.createdAt; }

    toPersistence(): PermissionProps {
        return { ...this.props };
    }
}
