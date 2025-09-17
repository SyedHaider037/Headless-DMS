import { db } from "../db";
import { documents } from "../schemas/document.schema";
import { roles } from "../schemas/role.schema";
import { rolePermissions } from "../schemas/rolePermission.schema";
import { permissions } from "../schemas/permission.schema";
import { eq, and } from "drizzle-orm";
import { IPermissionRepository } from "../interfaces/permission.interface";

export class PermissionRepository implements IPermissionRepository{

    async findDocumentById(documentId: string): Promise<any | null> {
        const [document] = await db
            .select()
            .from(documents)
            .where(eq(documents.id, documentId))
        return document || null;     
    }

    async findRoleById(roleId :string): Promise<any | null>{
        const [role] = await db
            .select()
            .from(roles)
            .where(eq(roles.id, roleId));
        return role || null; 
    }

    async checkRolePermission(roleId: string, action: string): Promise<boolean>{
        const [permission] = await db
            .select()
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(
                and(
                    eq(rolePermissions.roleId, roleId),
                    eq(permissions.action, action)
                )
            );
        return !!permission;
    }
}