import { Result } from "@carbonteq/fp";

import { AppError } from "../errors/app-error.js";
import { Document, DocumentChanges, NewDocument } from "../entities/document.entity.js";
export interface IDocumentRepository {
    save(data: NewDocument) :Promise<Result<Document, AppError>>;
    findAll(): Promise<Result<Document[], AppError>>;
    findById(documentId: string): Promise<Result<Document, AppError>>;
    delete(documentId: string): Promise<Result<Document, AppError>>;
    update(id: string, data: DocumentChanges): Promise<Result<Document, AppError>>;
    search(title?: string, tag?: string, authorId?: string): Promise<Result<Document[], AppError>>;
}