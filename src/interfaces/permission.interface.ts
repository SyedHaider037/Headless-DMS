import { Result } from "@carbonteq/fp";

import { AppError } from "../errors/app-error.js";
import { DocumentProps, DocumentChanges, NewDocument } from "../entities/document.entity.js";
import { RoleProps } from "../entities/role.entity.js";
export interface IPermissionRepository {
    findDocumentById(documentId: string): Promise<Result<DocumentProps | null, AppError>>;
    findRoleById(roleId: string): Promise<Result<RoleProps | null, AppError>>;
    checkRolePermission(roleId: string, action: string): Promise<Result<boolean, AppError>>;
}