import { db } from "../db"
import { documents } from "../schemas/document.schema";
import { eq, ilike, or } from "drizzle-orm";
import { IDocument } from "../interfaces/document.interface";

export class DocumentRespository implements IDocument {
    async create(data: {title: string, description?: string, tag: string ,authorId: string, filePath: string , fileType: string}) :Promise<any> {
        const [document] = await db.insert(documents).values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning()

        return document;
    }

    async findAll(): Promise<any> {
        return await db.select().from(documents);
    }

    async findById(documentId: string): Promise<any>{
        const [document] = await db
            .select()
            .from(documents)
            .where(eq(documents.id, documentId));

        return document;    
    }

    async delete(documentId:string): Promise<any> {
        const [deletedDoc] = await db
            .delete(documents)
            .where(eq(documents.id, documentId))
            .returning();
        return deletedDoc;    
    }

    async update(id: string, data: { title?: string; description?: string; tag?: string }): Promise<any> {
        const [updated] = await db.update(documents)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(documents.id, id))
            .returning();
        return updated;
    }
    
    async search(title?: string, tag?: string, authorId?: string): Promise<any> {
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

        return await db
            .select()
            .from(documents)
            .where(or(...whereConditions));
    }
}