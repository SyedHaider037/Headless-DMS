import { Request, Response, NextFunction } from "express";
import { container } from "../container.js";
import { sendError } from "../errors/http.js";
import { forbidden } from "../errors/app-error.js";
import { matchRes } from "@carbonteq/fp";

const { permissionService, logger } = container;

export const canCreateReadDocument = (action : "CREATE_DOCUMENT" | "READ_DOCUMENT") => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        const roleId = user?.roleId;

        if (!roleId) {
            return sendError(res, forbidden("User does not have a role assigned"));
        }

        const allowed = await permissionService.canUserPerformAction(roleId, action);

        return matchRes(allowed, {
            Ok: (allowed) => {
                if(!allowed) {
                    return sendError(res, forbidden(`You are not allowed to ${action.toLowerCase()}`));
                }
                return next();
            },
            Err: (err) =>{
                logger.error("Permission check failed", { action, error: err.message });
                return sendError(res, err);
            }
        });    
    }
}
