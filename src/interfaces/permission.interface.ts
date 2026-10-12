import { Result } from "@carbonteq/fp";

import { AppError } from "../errors/app-error.js";
export interface IPermissionRepository {
    findDocumentById(documentId: string): Promise<Result<any | null, AppError>>;
    findRoleById(roleId: string): Promise<Result<any | null, AppError>>;
    checkRolePermission(roleId: string, action: string): Promise<Result<boolean, AppError>>;
}