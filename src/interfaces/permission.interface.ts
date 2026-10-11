import { Result } from "@carbonteq/fp";

export interface IPermissionRepository {
    findDocumentById(documentId: string): Promise<Result<any | null, string>>;
    findRoleById(roleId: string): Promise<Result<any | null, string>>;
    checkRolePermission(roleId: string, action: string): Promise<Result<boolean, string>>;
}