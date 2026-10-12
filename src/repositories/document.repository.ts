import { db } from "../db/index.js"
import { documents } from "../schemas/document.schema.js";
import { eq, ilike, or } from "drizzle-orm";
import { IDocumentRepository } from "../interfaces/document.interface.js";
import { Result } from "@carbonteq/fp";

export class DocumentRespository implements IDocumentRepository {
    async create(data: {title: string, description?: string, tag: string ,authorId: string, filePath: string , fileType: string}) :Promise<Result<any, string>> {
        try {
            const [document] = await db.insert(documents).values({
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();

            return document ? Result.Ok(document) : Result.Err("Document not created");
        } catch (err) {
            return Result.Err("Failed to insert document in database");
        }
    }

    async findAll(): Promise<Result<any[], string>> {
        try {
            const result = await db.select().from(documents);
            return result ? Result.Ok(result) : Result.Err("No documents found");
        } catch (err) {
            return Result.Err("Failed to get documents from database");
        }
    }

    async findById(documentId: string): Promise<Result<any, string>> {
        try {
            const [document] = await db
                .select()
                .from(documents)
                .where(eq(documents.id, documentId));
    
            return document ? Result.Ok(document) : Result.Err("Document not found");
        } catch (err) {
            return Result.Err("Failed to fetch document by Id");
        }    
    }

    async delete(documentId:string): Promise<Result<any, string>> {
        try {
            const [deletedDoc] = await db
                .delete(documents)
                .where(eq(documents.id, documentId))
                .returning();
            return deletedDoc ? Result.Ok(deletedDoc) : Result.Err("Document not found or deleted already");   
        } catch (err) {
            return Result.Err("Failed to delete document");
        } 
    }

    async update(id: string, data: { title?: string; description?: string; tag?: string }): Promise<Result<any, string>> {
        try {
            const [updated] = await db.update(documents)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(documents.id, id))
                .returning();
            return updated ? Result.Ok(updated) : Result.Err("Document not found to update");
        } catch (err) {
            return Result.Err("Failed to update document.")
        }
    }
    
    async search(title?: string, tag?: string, authorId?: string): Promise<Result<any[], string>> {
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
            return result ? Result.Ok(result) : Result.Err("No documents matched the search criteria");   
        } catch (err) {
            return Result.Err("Failed to search document");
        }
    }
}