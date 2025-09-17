import { Request, Response, NextFunction } from "express";
import { PermissionService } from "../services/permission.service";
import { PermissionRepository } from "../repositories/permission.repository";

const permissionService = new PermissionService(new PermissionRepository);

export const canChangeDocument = (action: "UPDATE_DOCUMENT" | "DELETE_DOCUMENT") => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const documentId = req.params.id;
        const user = req.user;
    
        if (!documentId) {
            return res.status(400).json({ error: "Document ID is required" });
        }

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
    
        try {
            const allowed = await permissionService.canUserChangeDocument(
                user.id,
                user.roleId,
                documentId,
                action,
            )

            if (!allowed) {
                return res.status(403).json({error:`You arenot allowed to ${action.toLowerCase()}`});
            }

            return next();
            
        } catch (error) {
            console.error("Permission checking failed:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}        