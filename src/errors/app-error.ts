export type ErrorKind = "NotFound" | "Conflict" | "Unauthorized" | "Forbidden" | "Validation" | "Internal";

export class AppError extends Error {
    constructor(readonly kind: ErrorKind, message: string) {
        super(message);
        this.name = "AppError";
    }
}

export const notFound = (message: string) => new AppError("NotFound", message);
export const conflict = (message: string) => new AppError("Conflict", message);
export const unauthorized = (message: string) => new AppError("Unauthorized", message);
export const forbidden = (message: string) => new AppError("Forbidden", message);
export const validation = (message: string) => new AppError("Validation", message);
export const internal = (message: string) => new AppError("Internal", message);
