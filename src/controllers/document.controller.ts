import { Request, Response,  } from "express";
import { createDocumentSchema, updateDocumentSchema, listDocumentsQuerySchema, searchDocumentsQuerySchema} from "../validation/document.validation.js";   
import fs from "fs";
import { container } from "../container.js";
import { Document, PublicDocument } from "../entities/document.entity.js";
import { PaginatedCollection } from "../entities/pagination.entity.js";
import { sendError } from "../errors/http.js";
import { unauthorized, validation } from "../errors/app-error.js";
import { parseInput } from "../validation/parse.js";
import { storedFilePath } from "../middlewares/multer.middleware.js";
import { matchRes } from "@carbonteq/fp";

const { documentService, logger } = container;

// the entity decides what clients may see: the server-side file path never leaves
const toPublicPage = (page: PaginatedCollection<Document>): PaginatedCollection<PublicDocument> => ({
    ...page,
    items: page.items.map((document) => document.toPublic()),
});

// a rejected upload must not leave its file on disk
const discardUpload = async (file?: Express.Multer.File) => {
    if (file) await fs.promises.unlink(file.path).catch(() => undefined);
};

export const uploadDocument  = async ( req: Request, res: Response) => {

    const user = req.user;
    const file = req.file;
    if (!user) {
        await discardUpload(file);
        return sendError(res, unauthorized("Authentication required"));
    }

    const input = parseInput(createDocumentSchema, req.body);
    if (input.isErr()) {
        await discardUpload(file);
        return sendError(res, input.unwrapErr());
    }
    if (!file) return sendError(res, validation("File is required"));

    const { title, description, tag } = input.unwrap();
    const document = await documentService.upload({title, tag, userId: user.id, filePath: storedFilePath(file), fileType: file.mimetype, description});

    return matchRes(document, {
        Ok: (saved) => res.status(201).json({ document: saved.toPublic(), message: "Document uploaded successfully" }),
        Err: (err) => {
            void discardUpload(file);
            return sendError(res, err);
        }
    });
}

export const getAllDocuments = async (req: Request, res: Response) => {
    
    const query = parseInput(listDocumentsQuerySchema, req.query);
    if (query.isErr()) return sendError(res, query.unwrapErr());

    const allDocuments = await documentService.getAll(query.unwrap());

    return matchRes(allDocuments, {
        Ok: (documents) => res.status(200).json({ documents: toPublicPage(documents), message: "Documents fetched successfully" }),
        Err: (err) => sendError(res, err)
    });
}

export const getDocumentById = async(req: Request, res: Response) => {
    
    const parsedId = req.params.id;

    const document = await documentService.getById(parsedId);

    return matchRes(document, {
        Ok: (found) => res.status(200).json({ document: found.toPublic(), message: "Document fetched successfully" }),
        Err: (err) => sendError(res, err)
    });
}

export const deleteDocumentById = async (req: Request, res: Response) => {

    const parsedId = req.params.id;

    const document = await documentService.deleteById(parsedId);

    return matchRes(document, {
        Ok: ({ deletedDocument }) => res.status(200).json({ document: { id: deletedDocument.id, title: deletedDocument.title }, message: "Document deleted successfully" }),
        Err: (err) => sendError(res, err)
    });
}

export const updateDocument = async (req: Request, res: Response) => {
    
    const parsedId = req.params.id;

    const input = parseInput(updateDocumentSchema, req.body);
    if (input.isErr()) return sendError(res, input.unwrapErr());

    const { title, description, tag } = input.unwrap();

    const updatedDocument = await documentService.updateById({documentId: parsedId, title, description, tag});

    return matchRes(updatedDocument, {
        Ok: (updated) => res.status(200).json({ document: updated.toPublic(), message: "Document updated successfully" }),
        Err: (err) => sendError(res, err)
    });
}

export const searchDocuments = async (req: Request, res: Response) => {
    
    const query = parseInput(searchDocumentsQuerySchema, req.query);
    if (query.isErr()) return sendError(res, query.unwrapErr());

    const { page, limit, sortBy, sortOrder, ...filters } = query.unwrap();
    const results = await documentService.search(filters, { page, limit }, { sortBy, sortOrder });

    return matchRes(results, {
        Ok: (documents) => res.status(200).json({ documents: toPublicPage(documents), message: "Search completed successfully" }),
        Err: (err) => {
            logger.error("Document search failed", { error: err.message });
            return sendError(res, err);
        }
    });
}

export const generateDownloadLink = async (req: Request, res: Response) => {

        const parsedId = req.params.id;

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
