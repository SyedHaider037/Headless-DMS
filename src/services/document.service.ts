import path  from "path";
import jwt from "jsonwebtoken";
import fs from "fs";
import { DocumentRespository } from "../repositories/document.repository";
import { CreateDocumentDTO, UpdateDocumentDTO, SearchDocumentsDTO} from "../dtos/document.dto";

export class DocumentService {
    private repo: DocumentRespository;
    constructor() {
        this.repo = new DocumentRespository();
    }

    async upload(data: CreateDocumentDTO) : Promise<any> {
        const { title, tag, userId, file, description } = data;

        if (!file) throw new Error("File is required");

        const relativePath = path.relative(path.join(process.cwd(), "public"), file.path).replace(/\\/g, "/");
        const document = await this.repo.create({
            title,  
            description,
            tag,
            authorId: userId,
            filePath: relativePath,
            fileType: file.mimetype,
        });

        if (!document) throw new Error("Failed to upload document");

        return document;
    }

    async getAll(): Promise<any> {
        const allDocumets = await this.repo.findAll();

        if (allDocumets.length === 0) {
            throw new Error("No documents found");
        }
        return allDocumets;
    }

    async getById(documentId: string): Promise<any> {

        const document = await this.repo.findById(documentId);

        if (!document) throw new Error("Document not found");

        return document;
    }

    async deleteById(documentId: string): Promise<any> {

        const existingDocument = await this.repo.findById(documentId);

        if (!existingDocument) {
            throw new Error("Document not found");
        }

        const filePath = path.join(process.cwd(), "public", existingDocument.filePath);
        
        const deletedDocument = await this.repo.delete(documentId);

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

    async updateById(data: UpdateDocumentDTO): Promise<any> {
        const { documentId, title, description, tag } = data;

        const existingDocument = await this.repo.findById(documentId);

        if (!existingDocument) throw new Error("Document not found");
        
        const updatedDocument = await this.repo.update(documentId, { title, description, tag });
        
        if (!updatedDocument) throw new Error("Failed to update document");

        return updatedDocument;
    }

    async search(data: SearchDocumentsDTO): Promise<any> {
        const { title, tag, authorId } = data;

        const results = await this.repo.search(title, tag, authorId);
        if (results.length === 0) {
            throw new Error("No documents found");
        }
        return results;    
    }

    async downloadLink(documentId: string): Promise<string> {
        const document = await this.repo.findById(documentId);
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

        const document = await this.repo.findById(decoded.documentId);

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