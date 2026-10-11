import { db } from "../db";
import { documents } from "../schemas/document.schema";
import { roles } from "../schemas/role.schema";
import { rolePermissions } from "../schemas/rolePermission.schema";
import { permissions } from "../schemas/permission.schema";
import { eq, and } from "drizzle-orm";
import { IPermissionRepository } from "../interfaces/permission.interface";
import { Result } from "@carbonteq/fp";

export class PermissionRepository implements IPermissionRepository{

    async findDocumentById(documentId: string): Promise<Result<any | null, string>> {
        try {
            const [document] = await db
                .select()
                .from(documents)
                .where(eq(documents.id, documentId))
            return document ? Result.Ok(document) : Result.Ok(null); 
        } catch (error) {
            return Result.Err("Failed to Fetch Document");
        }    
    }

    async findRoleById(roleId :string): Promise<Result<any | null, string>> {
        try {
            const [role] = await db
                .select()
                .from(roles)
                .where(eq(roles.id, roleId));
            return role ? Result.Ok(role) : Result.Ok(null);
        } catch (error) {
            return Result.Err("Failed to fetch Role");
        }
    }

    async checkRolePermission(roleId: string, action: string): Promise<Result<boolean, string>> {
        try {
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
            return  Result.Ok(!!permission);
        } catch (error) {
            return Result.Err("Failed to fetch Permissions");
        }
    }
}