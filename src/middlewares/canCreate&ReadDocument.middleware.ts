import { Request, Response, NextFunction } from "express";
import { PermissionService } from "../services/permission.service.js";
import { PermissionRepository } from "../repositories/permission.repository.js";
import { matchRes } from "@carbonteq/fp";

const permissionService = new PermissionService(new PermissionRepository());

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
                console.error("Permission checking  failed:", err);
                return res.status(500).json({ error: "Internal server error" });
            }
        });    
    }
}
