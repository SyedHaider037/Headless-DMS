import { db } from "../db/index.js"
import { documents } from "../schemas/document.schema.js";
import { count, desc, eq } from "drizzle-orm";
import { IDocumentRepository } from "../interfaces/document.interface.js";
import { Result } from "@carbonteq/fp";

import { AppError, internal, notFound } from "../errors/app-error.js";
import { DEFAULT_DOCUMENT_SORT, Document, DocumentFilters, DocumentSort } from "../entities/document.entity.js";
import { buildDocumentConditions, buildDocumentOrder } from "./document.query.js";
import { PaginatedCollection, PaginationOptions, toPaginatedCollection } from "../entities/pagination.entity.js";

// rows are mapped to entities here and nowhere else
const toEntity = (row: typeof documents.$inferSelect): Document => Document.fromPersistence(row);

export class DocumentRepository implements IDocumentRepository {
    async save(document: Document): Promise<Result<Document, AppError>> {
        try {
            const [row] = await db.insert(documents).values(document.toPersistence()).returning();

            return row ? Result.Ok(toEntity(row)) : Result.Err(internal("Failed to create document"));
        } catch (err) {
            return Result.Err(internal("Failed to create document"));
        }
    }

    async findAll({ page, limit }: PaginationOptions): Promise<Result<PaginatedCollection<Document>, AppError>> {
        try {
            const rows = await db
                .select()
                .from(documents)
                .orderBy(desc(documents.createdAt), desc(documents.id))
                .limit(limit)
                .offset((page - 1) * limit);
            const [{ total }] = await db.select({ total: count() }).from(documents);
            return Result.Ok(toPaginatedCollection(rows.map(toEntity), total, { page, limit }));
        } catch (err) {
            return Result.Err(internal("Failed to list documents"));
        }
    }

    async findById(documentId: string): Promise<Result<Document, AppError>> {
        try {
            const [row] = await db
                .select()
                .from(documents)
                .where(eq(documents.id, documentId));

            return row ? Result.Ok(toEntity(row)) : Result.Err(notFound("Document not found"));
        } catch (err) {
            return Result.Err(internal("Failed to fetch document"));
        }
    }

    async delete(documentId: string): Promise<Result<Document, AppError>> {
        try {
            const [row] = await db
                .delete(documents)
                .where(eq(documents.id, documentId))
                .returning();
            return row ? Result.Ok(toEntity(row)) : Result.Err(notFound("Document not found"));
        } catch (err) {
            return Result.Err(internal("Failed to delete document"));
        }
    }

    async update(document: Document): Promise<Result<Document, AppError>> {
        try {
            const { title, description, tag, updatedAt } = document.toPersistence();
            const [row] = await db.update(documents)
                .set({ title, description, tag, updatedAt })
                .where(eq(documents.id, document.id))
                .returning();
            return row ? Result.Ok(toEntity(row)) : Result.Err(notFound("Document not found"));
        } catch (err) {
            return Result.Err(internal("Failed to update document"));
        }
    }

    async search(filters: DocumentFilters, { page, limit }: PaginationOptions, sort: DocumentSort = DEFAULT_DOCUMENT_SORT): Promise<Result<PaginatedCollection<Document>, AppError>> {
        try {
            const where = buildDocumentConditions(filters);
            const rows = await db
                .select()
                .from(documents)
                .where(where)
                .orderBy(...buildDocumentOrder(sort))
                .limit(limit)
                .offset((page - 1) * limit);
            const [{ total }] = await db.select({ total: count() }).from(documents).where(where);
            return Result.Ok(toPaginatedCollection(rows.map(toEntity), total, { page, limit }));
        } catch (err) {
            return Result.Err(internal("Failed to search documents"));
        }
    }
}
