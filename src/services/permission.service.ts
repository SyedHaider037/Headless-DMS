import { IPermissionRepository } from "../interfaces/permission.interface.js";
import { Result } from "@carbonteq/fp";
import { ILogger } from "../interfaces/logger.interface.js";

import { AppError } from "../errors/app-error.js";
export class PermissionService{
    constructor(private readonly repo: IPermissionRepository, private readonly logger: ILogger){}

    async  canUserChangeDocument(userId: string, roleId: string, documentId: string, action: string): Promise<Result<boolean, AppError>>{

        return Result.Ok(documentId)
            .flatMap(async() => await this.repo.findDocumentById(documentId))
            .flatMap(async(document) => {
                const role = await this.repo.findRoleById(roleId);
                return role.map((role) => ({document, role}));
            })
            .flatMap(async({document, role}): Promise<Result<boolean, AppError>> => {
                if (!document || !role) return Result.Ok(false);
                if (document.authorId === userId || role.name === "ADMIN") {
                    return await this.repo.checkRolePermission(roleId, action);
                }
                return Result.Ok(false);
            })
            .mapErr((err) => {
                this.logger.error("Permission check failed", { action, error: err.message });
                return err;
            })
            .toPromise();
    }

    async canUserPerformAction(roleId: string, action: string): Promise<Result<boolean, AppError>>{
        return Result.Ok({roleId, action})
        .flatMap(() => this.repo.checkRolePermission(roleId, action))
        .mapErr((err) => {
            this.logger.error("Permission check failed", { action, error: err.message });
            return err;
        })
        .toPromise();
    }
}