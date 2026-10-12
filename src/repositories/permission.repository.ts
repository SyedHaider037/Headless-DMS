import { db } from "../db/index.js";
import { documents } from "../schemas/document.schema.js";
import { roles } from "../schemas/role.schema.js";
import { rolePermissions } from "../schemas/rolePermission.schema.js";
import { permissions } from "../schemas/permission.schema.js";
import { eq, and } from "drizzle-orm";
import { IPermissionRepository } from "../interfaces/permission.interface.js";
import { Result } from "@carbonteq/fp";

import { AppError, internal } from "../errors/app-error.js";
export class PermissionRepository implements IPermissionRepository{

    async findDocumentById(documentId: string): Promise<Result<any | null, AppError>> {
        try {
            const [document] = await db
                .select()
                .from(documents)
                .where(eq(documents.id, documentId))
            return document ? Result.Ok(document) : Result.Ok(null); 
        } catch (error) {
            return Result.Err(internal("Failed to fetch document"));
        }    
    }

    async findRoleById(roleId :string): Promise<Result<any | null, AppError>> {
        try {
            const [role] = await db
                .select()
                .from(roles)
                .where(eq(roles.id, roleId));
            return role ? Result.Ok(role) : Result.Ok(null);
        } catch (error) {
            return Result.Err(internal("Failed to fetch role"));
        }
    }

    async checkRolePermission(roleId: string, action: string): Promise<Result<boolean, AppError>> {
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
            return Result.Err(internal("Failed to check role permission"));
        }
    }
}