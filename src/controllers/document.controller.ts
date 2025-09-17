import { Request, Response,  } from "express";
import { createDocumentSchema, updateDocumentSchema, documentSearchSchema} from "../validation/document.validation";   
import { DocumentService } from "../services/document.service";
import fs from "fs";
import { DocumentRespository } from "../repositories/document.repository";

const documentService= new DocumentService(new DocumentRespository());

export const uploadDocument  = async ( req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const parsed = createDocumentSchema.safeParse(req.body);
    
        if (!parsed.success) return res.status(400).json({error: "Validation failed",details: parsed.error.issues});
    
        const { title, description, tag } = parsed.data;
        const file = req.file;

        const document = await documentService.upload({title, tag, userId: user.id, file: file!, description});
    
        return res.status(201).json({ document, message: "Document uploaded successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const allDocuments = await documentService.getAll();
        return res.status(200).json({ documents: allDocuments , message: "Documents fetched successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getDocumentById = async(req: Request, res: Response) => {
    try {
        const parsedId = req.params.id;

        if (!parsedId) return res.status(400).json({ error: "Document ID is required" });
        const document = await documentService.getById(parsedId);

        return res.status(200).json({ document, message: "Document fetched successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const deleteDocumentById = async (req: Request, res: Response) => {
    try {
        const parsedId = req.params.id;

        if (!parsedId) return res.status(400).json({ error: "Document ID is required" });
        const document = await documentService.deleteById(parsedId);

        return res.status(200).json({document, message: "Document deleted successfully" });
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

        const updatedDocument = await documentService.updateById({documentId: parsedId, title, description, tag});

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
        const results = await documentService.search({title, tag, authorId});

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

        const link  = await documentService.downloadLink(parsedId);

        return res.status(200).json({ link, message: "Download token created successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const downloadDocument = async (req: Request, res: Response) => {
    try {
        const token = req.params.token;
        const { filePath, fileName } = await documentService.download(token);

        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}
