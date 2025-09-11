import { db } from "../db/index";
import { documents } from "../schemas/document.schema";
import path  from "path";
import { eq, ilike, or } from "drizzle-orm";
import jwt from "jsonwebtoken";
import fs from "fs";


export class DocumentService {
    async upload(title: string, tag: string, userId: string, file: Express.Multer.File, description?: string) : Promise<any> {

        if (!file) throw new Error("File is required");

        const relativePath = path.relative(path.join(process.cwd(), "public"), file.path).replace(/\\/g, "/");
        const document = await db.insert(documents).values({
            title,
            description,
            tag,
            authorId: userId,
            filePath: relativePath,
            fileType: file.mimetype,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        if (!document) throw new Error("Failed to upload document");

        return document;
    }

    async getAll(): Promise<any> {
        const allDocumets = await db.select().from(documents);

        if (allDocumets.length === 0) {
            throw new Error("No documents found");
        }
        return allDocumets;
    }

    async getById(documentId: string): Promise<any> {

        const [document] = await db.select().from(documents).where(eq(documents.id, documentId));

        if (!document) throw new Error("Document not found");

        return document;
    }

    async deleteById(documentId: string): Promise<any> {

        const [existingDocument] = await db.select().from(documents).where(eq(documents.id, documentId));

        if (!existingDocument) {
            throw new Error("Document not found");
        }

        const filePath = path.join(process.cwd(), "public", existingDocument.filePath);
        
        const [deletedDocument] = await db.delete(documents).where(eq(documents.id, documentId)).returning();

        if (!deletedDocument) {
            throw new Error("Failed to delete document");
        }

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Failed to delete file:", err);
            } 
        });
        return { deletedDocument, filePath };
    }

    async updateById(documentId: string, title?: string, description?: string, tag?: string): Promise<any> {
        const [existingDocument] = await db.select().from(documents).where(eq(documents.id, documentId));

        if (!existingDocument) throw new Error("Document not found");
        
        const updatedDocument = await db.update(documents).set({
            title,
            description,
            tag,
            updatedAt: new Date(),
        }).where(eq(documents.id, documentId)).returning();
        
        if (!updatedDocument) throw new Error("Failed to update document");

        return updatedDocument;
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
        const results = await db.
            select()
            .from(documents)
            .where(or(...whereConditions));
        if (results.length === 0) {
            throw new Error("No documents found");
        }
        return results;    
    }

    async downloadLink(documentId: string): Promise<string> {
        const [document] = await db.select().from(documents).where(eq(documents.id, documentId));
        if (!document) {
            throw new Error("Document not found");
        }

        const downloadToken = jwt.sign(
            { documentId: documentId },
            process.env.DOWNLOAD_TOKEN_SECRET!,
            { expiresIn: "10m" }
        );

        const link = `${process.env.BASE_URL}/api/v1/document/download/${downloadToken}`;
        return link;
    }

    async download(downloadToken: string): Promise<any> {

        let decoded;
        try {
            decoded = jwt.verify(downloadToken, process.env.DOWNLOAD_TOKEN_SECRET!) as { documentId: string };
        } catch (error: any) {
            if (error.name === "TokenExpiredError") {
                throw new Error("Download token expired");
            }
            throw new Error("Invalid download token");
        }

        const [document] = await db.select().from(documents).where(eq(documents.id, decoded.documentId));

        if (!document) throw new Error("Document not found");

        const filePath = path.join("public", document.filePath);
        const fileExt = path.extname(filePath);
        const fileName = `${document.title}${fileExt}`;

        if (!fs.existsSync(filePath)) {
            throw new Error("File not found on server");
        }

        return {fileName, filePath};
    }
}