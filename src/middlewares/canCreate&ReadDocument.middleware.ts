import { Request, Response, NextFunction } from "express";
import { container } from "../container.js";
import { matchRes } from "@carbonteq/fp";

const { permissionService, logger } = container;

export const canCreateReadDocument = (action : "CREATE_DOCUMENT" | "READ_DOCUMENT") => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        const roleId = user?.roleId;

        if (!roleId) {
            return res.status(403).json({ error: "User does not have a role assigned" });
        }

        const allowed = await permissionService.canUserPerformAction(roleId, action);

        return matchRes(allowed, {
            Ok: (allowed) => {
                if(!allowed) {
                    return res.status(403).json({ error: `You are not allowed to ${action.toLowerCase()}`});
                }
                return next();
            },
            Err: (err) =>{
                logger.error("Permission check failed", { action, error: err });
                return res.status(500).json({ error: "Internal server error" });
            }
        });    
    }
}
