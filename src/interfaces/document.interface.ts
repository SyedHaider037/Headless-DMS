import { Result } from "@carbonteq/fp";
import { AppError } from "../errors/app-error.js";
import { Document, DocumentFilters, DocumentSort } from "../entities/document.entity.js";
import { PaginatedCollection, PaginationOptions } from "../entities/pagination.entity.js";

export interface IDocumentRepository {
    // inserts a new document; the entity already carries its application-generated id
    save(document: Document): Promise<Result<Document, AppError>>;
    findAll(options: PaginationOptions): Promise<Result<PaginatedCollection<Document>, AppError>>;
    findById(documentId: string): Promise<Result<Document, AppError>>;
    delete(documentId: string): Promise<Result<Document, AppError>>;
    // persists the changes made to an existing document
    update(document: Document): Promise<Result<Document, AppError>>;
    search(filters: DocumentFilters, options: PaginationOptions, sort?: DocumentSort): Promise<Result<PaginatedCollection<Document>, AppError>>;
}
