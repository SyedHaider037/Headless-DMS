import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError, internal, validation } from "../errors/app-error.js";
import { sendError } from "../errors/http.js";
import { config } from "../config.js";

// last-resort handler: turns errors raised by middleware (multer, typed errors) into typed responses
export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    if (err instanceof AppError) return sendError(res, err);
    if (err instanceof multer.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE"
            ? `File is too large. The maximum size is ${config.maxUploadMb} MB`
            : `Invalid upload: ${err.message}`;
        return sendError(res, validation(message));
    }
    return sendError(res, internal("Unhandled error"));
};
