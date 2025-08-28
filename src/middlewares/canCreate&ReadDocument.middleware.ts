import { db } from "../db/index";
import { rolePermissions } from "../schemas/rolePermission.schema";
import { permissions } from "../schemas/permission.schema";
import { eq, and } from "drizzle-orm";
import { Request, Response, NextFunction } from "express";

export const canCreateReadDocument = (action : "CREATE_DOCUMENT" | "READ_DOCUMENT") => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        try {
            const roleId = user?.roleId;

            if (!roleId) {
                return res.status(403).json({ error: "User does not have a role assigned" });
            }

            const [permissionRow] = await db
                .select()
                .from(rolePermissions)
                .innerJoin(
                    permissions,
                    eq(rolePermissions.permissionId, permissions.id)
                )
                .where(
                    and(
                        eq(rolePermissions.roleId, roleId),
                        eq(permissions.action, action)
                    )
                );

            if (!permissionRow) {
                return res.status(403).json({ error: `You are not allowed to ${action.toLowerCase()}` });
            }
            return next();
        } catch (error) {
            console.error("Permission check failed:", error);
            return res.status(500).json({ error: "Internal server error" });
        } 
    }
}
