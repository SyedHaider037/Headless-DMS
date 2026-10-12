import { Request, Response, NextFunction } from "express";
import { container } from "../container.js";
import { matchRes } from "@carbonteq/fp";

const { permissionService, logger } = container;

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
    
        
        const allowed = await permissionService.canUserChangeDocument(
            user.id,
            user.roleId,
            documentId,
            action,
        )

        return matchRes(allowed, {
            Ok: (allowed) =>{
                if (!allowed) {
                    return res.status(403).json({error:`You arenot allowed to ${action.toLowerCase()}`});
                }
                return next();
            },
            Err: (err) => {
                logger.error("Permission check failed", { action, error: err.message });
                res.status(500).json({error: "Internal server error"});
            }
        })        
    }
}        