import { Request, Response,  } from "express";
import { createDocumentSchema, updateDocumentSchema, documentSearchSchema} from "../validation/document.validation.js";   
import fs from "fs";
import path from "path";
import { container } from "../container.js";
import { sendError } from "../errors/http.js";
import { matchRes } from "@carbonteq/fp";

const { documentService, logger } = container;

// never expose the server-side file path to clients
const toPublicDocument = ({ filePath, ...document }: any) => document;

export const uploadDocument  = async ( req: Request, res: Response) => {

    const user = req.user; 
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const parsed = createDocumentSchema.safeParse(req.body);

    if (!parsed.success) return res.status(400).json({error: "Validation failed",details: parsed.error.issues});

    const { title, description, tag } = parsed.data;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "File is required"});

    const relativePath = path.relative(path.join(process.cwd(), "public"), file.path).replace(/\\/g, "/");

    const document = await documentService.upload({title, tag, userId: user.id, filePath: relativePath, fileType: file.mimetype, description});

    return matchRes(document, {
        Ok: (saved) => res.status(201).json({ document: toPublicDocument(saved), message: "Document uploaded successfully" }),
        Err: (err) => sendError(res, err)
    });
}

export const getAllDocuments = async (req: Request, res: Response) => {
    
    const allDocuments = await documentService.getAll();

    return matchRes(allDocuments, {
        Ok: (documents) => res.status(200).json({ documents: documents.map(toPublicDocument), total: documents.length, message: "Documents fetched successfully" }),
        Err: (err) => sendError(res, err)
    });
}

export const getDocumentById = async(req: Request, res: Response) => {
    
    const parsedId = req.params.id;

    if (!parsedId) return res.status(400).json({ error: "Document ID is required" });
    const document = await documentService.getById(parsedId);

    return matchRes(document, {
        Ok: (found) => res.status(200).json({ document: toPublicDocument(found), message: "Document fetched successfully" }),
        Err: (err) => sendError(res, err)
    });
}

export const deleteDocumentById = async (req: Request, res: Response) => {

    const parsedId = req.params.id;

    if (!parsedId) return res.status(400).json({ error: "Document ID is required" });   
    const document = await documentService.deleteById(parsedId);

    return matchRes(document, {
        Ok: ({ deletedDocument }) => res.status(200).json({ document: { id: deletedDocument.id, title: deletedDocument.title }, message: "Document deleted successfully" }),
        Err: (err) => sendError(res, err)
    });
}

export const updateDocument = async (req: Request, res: Response) => {
    
    const parsedId = req.params.id;

    const parsed = updateDocumentSchema.safeParse(req.body);

    if (!parsed.success) return res.status(400).json({ error: "Validation failed" , details: parsed.error.issues});

    const { title, description, tag } = parsed.data;

    const updatedDocument = await documentService.updateById({documentId: parsedId, title, description, tag});

    return matchRes(updatedDocument, {
        Ok: (updated) => res.status(200).json({ document: toPublicDocument(updated), message: "Document updated successfully" }),
        Err: (err) => sendError(res, err)
    });
}

export const searchDocuments = async (req: Request, res: Response) => {
    
    const parsed = documentSearchSchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid search params", details: parsed.error.issues });
    }
    
    const { title, tag, authorId } = parsed.data;
    const results = await documentService.search({title, tag, authorId});

    return matchRes(results, {
        Ok: (documents) => res.status(200).json({ documents: documents.map(toPublicDocument), total: documents.length, message: "Search completed successfully" }),
        Err: (err) => {
            logger.error("Document search failed", { error: err.message });
            return sendError(res, err);
        }
    });
}

export const generateDownloadLink = async (req: Request, res: Response) => {

        const parsedId = req.params.id;

        if (!parsedId) return res.status(400).json({ error: "Document ID is required" });

        const linkresult  = await documentService.downloadLink(parsedId);

        return matchRes(linkresult, {
            Ok: (link) =>  res.status(200).json({ link, message: "Download token created successfully" }),
            Err: (err) => sendError(res, err)
        });
}

export const downloadDocument = async (req: Request, res: Response) => {
    
    const token = req.params.token;
    const result = await documentService.download(token);

    return matchRes(result, {
        Ok: ({ filePath, fileName }) => {
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            const fileStream = fs.createReadStream(filePath);
            return fileStream.pipe(res);
        },
        Err: (err) => sendError(res, err)
    });    
}
