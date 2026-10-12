import { db } from "../db/index.js"
import { documents } from "../schemas/document.schema.js";
import { eq, ilike, or } from "drizzle-orm";
import { IDocumentRepository } from "../interfaces/document.interface.js";
import { Result } from "@carbonteq/fp";

import { AppError, internal, notFound } from "../errors/app-error.js";
export class DocumentRepository implements IDocumentRepository {
    async save(data: {title: string, description?: string, tag: string ,authorId: string, filePath: string , fileType: string}) :Promise<Result<any, AppError>> {
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

    async findAll(): Promise<Result<any[], AppError>> {
        try {
            const result = await db.select().from(documents);
            return result ? Result.Ok(result) : Result.Err(internal("Failed to list documents"));
        } catch (err) {
            return Result.Err(internal("Failed to list documents"));
        }
    }

    async findById(documentId: string): Promise<Result<any, AppError>> {
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

    async delete(documentId:string): Promise<Result<any, AppError>> {
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

    async update(id: string, data: { title?: string; description?: string; tag?: string }): Promise<Result<any, AppError>> {
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
    
    async search(title?: string, tag?: string, authorId?: string): Promise<Result<any[], AppError>> {
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
    
            const result =  await db
                .select()
                .from(documents)
                .where(or(...whereConditions));
            return result ? Result.Ok(result) : Result.Err(internal("Failed to search documents"));   
        } catch (err) {
            return Result.Err(internal("Failed to search documents"));
        }
    }
}