import { Result } from "@carbonteq/fp";

import { AppError } from "../errors/app-error.js";
export interface IDocumentRepository {
    create(data: {title: string, description?: string, tag: string,authorId: string, filePath: string, fileType: string}) :Promise<Result<any, AppError>>;
    findAll(): Promise<Result<any[], AppError>>;
    findById(documentId: string): Promise<Result<any, AppError>>;
    delete(documentId: string): Promise<Result<any, AppError>>;
    update(id: string, data: { title?: string; description?: string; tag?: string }): Promise<Result<any, AppError>>;
    search(title?: string, tag?: string, authorId?: string): Promise<Result<any[], AppError>>;
}