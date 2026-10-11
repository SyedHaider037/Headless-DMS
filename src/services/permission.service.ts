import { IPermissionRepository } from "../interfaces/permission.interface";
import { Result } from "@carbonteq/fp";

export class PermissionService{
    constructor(private readonly repo: IPermissionRepository){}

    async  canUserChangeDocument(userId: string, roleId: string, documentId: string, action: string): Promise<Result<boolean, string>>{

        return Result.Ok(documentId)
            .flatMap(async() => await this.repo.findDocumentById(documentId))
            .flatMap(async(document) => {
                const role = await this.repo.findRoleById(roleId);
                return role.map((role) => ({document, role}));
            })
            .flatMap(async({document, role}): Promise<Result<boolean, string>> => {
                if (!document || !role) return Result.Ok(false);
                if (document.authorId === userId || role.name === "ADMIN") {
                    return await this.repo.checkRolePermission(roleId, action);
                }
                return Result.Ok(false);
            })
            .mapErr((err) => {
                console.error(`User didnot have permission to ${action} : ${err}`)
                return err;
            })
            .toPromise();
    }

    async canUserPerformAction(roleId: string, action: string): Promise<Result<boolean, string>>{
        return Result.Ok({roleId, action})
        .flatMap(() => this.repo.checkRolePermission(roleId, action))
        .mapErr((err) => {
            console.error(`User didnot have permission to ${action} : ${err}`)
            return err;
        })
        .toPromise();
    }
}