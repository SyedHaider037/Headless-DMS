export interface IPermissionRepository {
    findDocumentById(documentId: string): Promise<any | null>;
    findRoleById(roleId: string): Promise<any | null>;
    checkRolePermission(roleId: string, action: string): Promise<boolean>;
}