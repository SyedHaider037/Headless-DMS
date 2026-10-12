import { NextFunction, Request, Response } from "express";
import { AuthenticatedUser } from "../entities/user.entity.js";
import { AppError } from "../errors/app-error.js";
import { container } from "../container.js";
import { sendError } from "../errors/http.js";
import { matchRes } from "@carbonteq/fp";

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser; 
        }
    }
}

const { authHandler } = container;

// finds the credential on the request and lets the configured IAuthHandler decide who the caller is
export const verifyAuthToken = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");

    const user = await authHandler.authenticate({ token });

    return matchRes<AuthenticatedUser, AppError, void>(user,{
        Ok: (authenticatedUser) => {
            req.user = authenticatedUser;
            return next();
        },
        Err: (error) => sendError(res, error)
    });
};
