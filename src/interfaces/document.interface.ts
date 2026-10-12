import { Result } from "@carbonteq/fp";
import { AppError } from "../errors/app-error.js";
import { Document, DocumentChanges, DocumentFilters, DocumentSort, NewDocument } from "../entities/document.entity.js";
import { PaginatedCollection, PaginationOptions } from "../entities/pagination.entity.js";

export interface IDocumentRepository {
    save(data: NewDocument): Promise<Result<Document, AppError>>;
    findAll(options: PaginationOptions): Promise<Result<PaginatedCollection<Document>, AppError>>;
    findById(documentId: string): Promise<Result<Document, AppError>>;
    delete(documentId: string): Promise<Result<Document, AppError>>;
    update(id: string, data: DocumentChanges): Promise<Result<Document, AppError>>;
    search(filters: DocumentFilters, options: PaginationOptions, sort?: DocumentSort): Promise<Result<PaginatedCollection<Document>, AppError>>;
}