import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { validation } from "../errors/app-error.js";
import { sendError } from "../errors/http.js";

// checks the shape of req.params; a bad value answers 400 through the typed-error path
export const validateParams = (schema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const parsed = schema.safeParse(req.params);
        if (!parsed.success) {
            return sendError(res, validation(parsed.error.issues[0]?.message ?? "Invalid route parameters"));
        }
        return next();
    };
};
