import { IPermissionRepository } from "../interfaces/permission.interface";

export class PermissionService{
    constructor(private readonly repo: IPermissionRepository){}

    async  canUserChangeDocument(userId: string, roleId: string, documentId: string, action: string): Promise<boolean>{

        const [document] = await this.repo.findDocumentById(documentId);
        if (!document) return false;

        const [role] = await this.repo.findRoleById(roleId);
        if(!role) return false;
        
        if (document.authorId === userId || role.name === "ADMIN") {
            return await this.repo.checkRolePermission(roleId, action);
        }
        return false;
    }
    
    async canUserPerformAction(roleId: string, action: string): Promise<boolean>{
        return await this.repo.checkRolePermission(roleId, action);  
    }
}