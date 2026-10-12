import { Request, Response, NextFunction } from "express";
import { container } from "../container.js";
import { sendError } from "../errors/http.js";
import { forbidden, unauthorized } from "../errors/app-error.js";
import { matchRes } from "@carbonteq/fp";

const { permissionService, logger } = container;

export const canChangeDocument = (action: "UPDATE_DOCUMENT" | "DELETE_DOCUMENT") => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const documentId = req.params.id;
        const user = req.user;
    
        if (!user) {
            return sendError(res, unauthorized("Authentication required"));
        }
    
        
        const allowed = await permissionService.canUserChangeDocument(
            user.id,
            user.roleId,
            documentId,
            action,
        )

        return matchRes(allowed, {
            Ok: (allowed) =>{
                if (!allowed) {
                    return sendError(res, forbidden(`You are not allowed to ${action.toLowerCase()}`));
                }
                return next();
            },
            Err: (err) => {
                logger.error("Permission check failed", { action, error: err.message });
                return sendError(res, err);
            }
        })        
    }
}        