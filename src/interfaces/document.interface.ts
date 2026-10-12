import { Result } from "@carbonteq/fp";
import { AppError } from "../errors/app-error.js";
import { DocumentProps, DocumentChanges, DocumentFilters, DocumentSort, NewDocument } from "../entities/document.entity.js";
import { PaginatedCollection, PaginationOptions } from "../entities/pagination.entity.js";

export interface IDocumentRepository {
    save(data: NewDocument): Promise<Result<DocumentProps, AppError>>;
    findAll(options: PaginationOptions): Promise<Result<PaginatedCollection<DocumentProps>, AppError>>;
    findById(documentId: string): Promise<Result<DocumentProps, AppError>>;
    delete(documentId: string): Promise<Result<DocumentProps, AppError>>;
    update(id: string, data: DocumentChanges): Promise<Result<DocumentProps, AppError>>;
    search(filters: DocumentFilters, options: PaginationOptions, sort?: DocumentSort): Promise<Result<PaginatedCollection<DocumentProps>, AppError>>;
}