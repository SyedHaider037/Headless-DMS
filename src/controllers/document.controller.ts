import { Request, Response,  } from "express";
import { createDocumentSchema, updateDocumentSchema, documentSearchSchema} from "../validation/document.validation";   
import { db } from "../db/index";
import { documents } from "../schemas/document.schema";
import { eq, or, ilike } from "drizzle-orm";   
import jwt from "jsonwebtoken"; 
import fs from "fs";
import path from "path";

export const uploadDocument  = async ( req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const parsed = createDocumentSchema.safeParse(req.body);
    
        if (!parsed.success) return res.status(400).json({error: "Validation failed",details: parsed.error.issues});
    
        const { title, description, tag } = parsed.data;
        const file = req.file;
    
        if (!file?.path) return res.status(400).json({ error: "file is required" });
    
        const relativePath = path.relative(path.join(process.cwd(), "public"), file.path).replace(/\\/g, "/");
    
        const document  = await db.insert(documents).values({
            title,
            description,
            tag,
            authorId: user.id,
            filePath: relativePath,
            fileType: file.mimetype,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning();
    
        if (!document) return res.status(500).json({ error: "Failed to upload document" });
    
        return res.status(201).json({ message: "Document uploaded successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const allDocuments = await db.select().from(documents);

        if (allDocuments.length === 0) res.status(404).json({ error: "No documents found" });

        return res.status(200).json({ documents: allDocuments , message: "Documents fetched successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getDocumentById = async(req: Request, res: Response) => {
    try {
        const parsedId = req.params.id;

        if (!parsedId) return res.status(400).json({ error: "Document ID is required" });

        const [document] = await db.select().from(documents).where(eq(documents.id, parsedId));

        if (!document) return res.status(404).json({ error: "Document not found" });

        return res.status(200).json({ document, message: "Document fetched successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const deleteDocumentById = async (req: Request, res: Response) => {
    try {
        const parsedId = req.params.id;

        if (!parsedId) return res.status(400).json({ error: "Document ID is required" });

        const [existingDocument] = await db.select().from(documents).where(eq(documents.id, parsedId));

        if (!existingDocument) return res.status(404).json({ error: "Document not found" });

        const filePath = path.join(process.cwd(), "public", existingDocument.filePath);

        const deletedDocument = await db.delete(documents).where(eq(documents.id, parsedId));

        if (!deletedDocument) return res.status(500).json({ error: "Failed to delete document" });

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Failed to delete file from disk", err);
            }
        });

        return res.status(200).json({ message: "Document deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const updateDocument = async (req: Request, res: Response) => {
    try {
        const parsedId = req.params.id;

        const parsed = updateDocumentSchema.safeParse(req.body);

        if (!parsed.success) return res.status(400).json({ error: "Validation failed" , details: parsed.error.issues});

        const { title, description, tag } = parsed.data;

        const [existingDocument] = await db.select().from(documents).where(eq(documents.id, parsedId));

        if (!existingDocument) return res.status(404).json({ error: "Document not found" });

        const updatedDocument = await db.update(documents)
            .set({
                title,
                description,
                tag,
                updatedAt: new Date(),
            })
            .where(eq(documents.id, parsedId))
            .returning();

        if (!updatedDocument) return res.status(500).json({ error: "Failed to update document" });

        return res.status(200).json({ document: updatedDocument, message: "Document updated successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const searchDocuments = async (req: Request, res: Response) => {
    try {
        const parsed = documentSearchSchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid search params", details: parsed.error.issues });
        }

        const { title, tag, authorId } = parsed.data;

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

        if (whereConditions.length === 0) {
            return res.status(400).json({ error: "At least one search parameter (title, tag, or authorId) is required" });
        }

        const results = await db
            .select()
            .from(documents)
            .where(or(...whereConditions));

        if (results.length === 0) {
            return res.status(404).json({ error: "No documents found matching the search criteria" });
        }

        return res.status(200).json({ documents: results, message: "Search completed successfully" });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const generateDownloadLink = async (req: Request, res: Response) => {
    try {
        const parsedId = req.params.id;

        if (!parsedId) return res.status(400).json({ error: "Document ID is required" });

        const [document] = await db.select().from(documents).where(eq(documents.id, parsedId));

        if (!document) return res.status(404).json({ error: "Document not found" });

        const downloadToken = jwt.sign(
            { documentId: document.id },
            process.env.DOWNLOAD_TOKEN_SECRET!,
            { expiresIn: '10m' }
        );

        const link = `${process.env.BASE_URL}/api/v1/document/download/${downloadToken}`;

        return res.status(200).json({ link, message: "Download token created successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const downloadDocument = async (req: Request, res: Response) => {
    try {
        const token = req.params.token;

        if (!token) return res.status(400).json({ error: "Download token is required" });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.DOWNLOAD_TOKEN_SECRET!) as { documentId: string };
        } catch (error: any) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ error: "Token expired" });
            }
            return res.status(403).json({ error: "Invalid token" });
        }

        const [document] = await db.select().from(documents).where(eq(documents.id, decoded.documentId));

        if (!document) return res.status(404).json({ error: "Document not found" });

        const filePath = path.join("public", document.filePath);
        const fileExt = path.extname(filePath);
        const fileName = `${document.title}.${fileExt}`;

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found on server" });
        }

        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}
