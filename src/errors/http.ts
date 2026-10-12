import { Response } from "express";
import { AppError, ErrorKind } from "./app-error.js";

const STATUS_BY_KIND: Record<ErrorKind, number> = {
    NotFound: 404,
    Conflict: 409,
    Unauthorized: 401,
    Forbidden: 403,
    Validation: 400,
    Internal: 500,
};

// internal details stay in the logs; clients only see a generic message for 500s
export const sendError = (res: Response, error: AppError) => {
    const message = error.kind === "Internal" ? "Internal server error" : error.message;
    return res.status(STATUS_BY_KIND[error.kind]).json({ error: message });
};
