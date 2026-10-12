import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { parseInput } from "../validation/parse.js";
import { sendError } from "../errors/http.js";

// checks the shape of req.params; a bad value answers 400 through the typed-error path
export const validateParams = (schema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const params = parseInput(schema, req.params);
        if (params.isErr()) return sendError(res, params.unwrapErr());
        return next();
    };
};
