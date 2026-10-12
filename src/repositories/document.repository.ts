import { db } from "../db/index.js"
import { documents } from "../schemas/document.schema.js";
import { count, desc, eq, ilike, or } from "drizzle-orm";
import { IDocumentRepository } from "../interfaces/document.interface.js";
import { Result } from "@carbonteq/fp";

import { AppError, internal, notFound } from "../errors/app-error.js";
import { Document, DocumentChanges, DocumentFilters, NewDocument } from "../entities/document.entity.js";
import { PaginatedCollection, PaginationOptions, toPaginatedCollection } from "../entities/pagination.entity.js";
export class DocumentRepository implements IDocumentRepository {
    async save(data: NewDocument) :Promise<Result<Document, AppError>> {
        try {
            const [document] = await db.insert(documents).values({
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();

            return document ? Result.Ok(document) : Result.Err(internal("Failed to create document"));
        } catch (err) {
            return Result.Err(internal("Failed to create document"));
        }
    }

    async findAll({ page, limit }: PaginationOptions): Promise<Result<PaginatedCollection<Document>, AppError>> {
        try {
            const items = await db
                .select()
                .from(documents)
                .orderBy(desc(documents.createdAt), desc(documents.id))
                .limit(limit)
                .offset((page - 1) * limit);
            const [{ total }] = await db.select({ total: count() }).from(documents);
            return Result.Ok(toPaginatedCollection(items, total, { page, limit }));
        } catch (err) {
            return Result.Err(internal("Failed to list documents"));
        }
    }

    async findById(documentId: string): Promise<Result<Document, AppError>> {
        try {
            const [document] = await db
                .select()
                .from(documents)
                .where(eq(documents.id, documentId));
    
            return document ? Result.Ok(document) : Result.Err(notFound("Document not found"));
        } catch (err) {
            return Result.Err(internal("Failed to fetch document"));
        }    
    }

    async delete(documentId:string): Promise<Result<Document, AppError>> {
        try {
            const [deletedDoc] = await db
                .delete(documents)
                .where(eq(documents.id, documentId))
                .returning();
            return deletedDoc ? Result.Ok(deletedDoc) : Result.Err(notFound("Document not found"));   
        } catch (err) {
            return Result.Err(internal("Failed to delete document"));
        } 
    }

    async update(id: string, data: DocumentChanges): Promise<Result<Document, AppError>> {
        try {
            const [updated] = await db.update(documents)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(documents.id, id))
                .returning();
            return updated ? Result.Ok(updated) : Result.Err(notFound("Document not found"));
        } catch (err) {
            return Result.Err(internal("Failed to update document"))
        }
    }
    
    async search({ title, tag, authorId }: DocumentFilters, { page, limit }: PaginationOptions): Promise<Result<PaginatedCollection<Document>, AppError>> {
        try {
            const whereConditions = [];
            if (title) {
                whereConditions.push(ilike(documents.title, `%${title}%`));
            }
            if (tag) {
                whereConditions.push(ilike(documents.tag, `%${tag}%`));
            } 
            if (authorId) {
                whereConditions.push(eq(documents.authorId, authorId));
            }
    
            const where = or(...whereConditions);
            const items = await db
                .select()
                .from(documents)
                .where(where)
                .orderBy(desc(documents.createdAt), desc(documents.id))
                .limit(limit)
                .offset((page - 1) * limit);
            const [{ total }] = await db.select({ total: count() }).from(documents).where(where);
            return Result.Ok(toPaginatedCollection(items, total, { page, limit }));
        } catch (err) {
            return Result.Err(internal("Failed to search documents"));
        }
    }
}