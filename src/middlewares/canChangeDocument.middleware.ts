import { Request, Response, NextFunction } from "express";
import { db } from "../db/index";
import { documents } from "../schemas/document.schema";
import { rolePermissions } from "../schemas/rolePermission.schema";
import { permissions } from "../schemas/permission.schema";
import { roles } from "../schemas/role.schema";
import { and, eq } from "drizzle-orm";   

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
            const [document] = await db
                .select()
                .from(documents)
                .where(eq(documents.id, documentId));
    
            if (!document) return res.status(404).json({ error: "Document not found" });
            
            const [role] = await db
                .select()
                .from(roles)
                .where(eq(roles.id, user.roleId));

            if (!role) return res.status(403).json({ error: "User does not have a role assigned" });    

            if (document.authorId === user?.id || role.name === "ADMIN") {
                const [Permission] = await db
                    .select()
                    .from(rolePermissions)
                    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
                    .where(
                        and(
                            eq(rolePermissions.roleId, user.roleId),
                            eq(permissions.action, action)
                        )
                    );

                if (!Permission) {
                    return res.status(403).json({ error: `You are not allowed to ${action.toLowerCase()}` });
                }

                return next();
            } else {
                return res.status(403).json({ error: "You can only modify your own documents" });
            }

            
        } catch (error) {
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}        