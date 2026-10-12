import path  from "path";
import jwt, { SignOptions } from "jsonwebtoken";
import fs from "fs";
import { CreateDocumentDTO, UpdateDocumentDTO, SearchDocumentsDTO} from "../dtos/document.dto.js";
import { IDocumentRepository } from "../interfaces/document.interface.js";
import { Result } from "@carbonteq/fp";
import { config } from "../config.js";
import { ILogger } from "../interfaces/logger.interface.js";

import { AppError, notFound, unauthorized } from "../errors/app-error.js";
import { Document } from "../entities/document.entity.js";
import { PaginatedCollection, PaginationOptions } from "../entities/pagination.entity.js";
export class DocumentService {
    constructor(private readonly repo: IDocumentRepository, private readonly logger: ILogger) {}

    async upload(data: CreateDocumentDTO) : Promise<Result<Document, AppError>> {
        const { title, tag, userId, filePath, fileType, description } = data;

        return Result.Ok(data)
            .flatMap(async(d) => await this.repo.save({
                title: d.title,
                description: d.description,
                tag: d.tag,
                authorId: d.userId,
                filePath: d.filePath,
                fileType: d.fileType,
            }))
            .mapErr((err) => {
                this.logger.error("Document upload failed", { userId, error: err.message });
                return err;
            })
            .toPromise();
    }

    async getAll(options: PaginationOptions): Promise<Result<PaginatedCollection<Document>, AppError>> {

        return Result.Ok(null)
            .flatMap(async() => await this.repo.findAll(options))
            .mapErr((err) => {
                this.logger.error("Fetching documents failed", { error: err.message });
                return err;
            })
            .toPromise();
        
    }

    async getById(documentId: string): Promise<Result<Document, AppError>> {

        return Result.Ok(documentId)
            .flatMap(async(docId) => await this.repo.findById(docId))
            .mapErr((err) => {
                this.logger.error("Fetching document failed", { documentId, error: err.message });
                return err;
            })
            .toPromise();
    }

    async deleteById(documentId: string): Promise<Result<{ deletedDocument: Document, filePath: string }, AppError>> {

        return Result.Ok(documentId)
            .flatMap(async(docId) => await this.repo.findById(docId))
            .flatMap((doc) => {
                const filePath = path.join(process.cwd(), "public", doc.filePath);
                return Result.Ok({doc, filePath});
            })
            .flatMap(async({filePath}) => {
                const deletedDocument = await this.repo.delete(documentId);
                return deletedDocument.map((deleted) => {
                    fs.unlink(filePath, (err) => {
                        if (err) this.logger.error("Failed to delete file from disk", { documentId, error: err.message });
                    });
                    return { deletedDocument: deleted, filePath };
                });
            })
            .mapErr((err) => {
                this.logger.error("Document delete failed", { documentId, error: err.message });
                return err;
            })
            .toPromise();
    }

    async updateById(data: UpdateDocumentDTO): Promise<Result<Document, AppError>> {
        const { documentId, title, description, tag } = data;

        return Result.Ok(documentId)
            .flatMap(async () => await this.repo.findById(documentId))
            .flatMap(async () => await this.repo.update(documentId, {title, description, tag}))
            .mapErr((err) => {
                this.logger.error("Document update failed", { documentId, error: err.message });
                return err;
            })
            .toPromise();
    }

    async search(data: SearchDocumentsDTO, options: PaginationOptions): Promise<Result<PaginatedCollection<Document>, AppError>> {

        return Result.Ok(data)
            .flatMap(async (data) => await this.repo.search({ title: data.title, tag: data.tag, authorId: data.authorId }, options))
            .mapErr((err) => {
                this.logger.error("Document search failed", { error: err.message });
                return err;
            })
            .toPromise();
    }

    async downloadLink(documentId: string): Promise<Result<string, AppError>> {

        return Result.Ok(documentId)
            .flatMap(async() => await this.repo.findById(documentId))
            .flatMap(() => {
                const downloadToken = jwt.sign(
                    { documentId: documentId },
                    config.downloadToken.secret,
                    { expiresIn: config.downloadToken.expiry as SignOptions["expiresIn"] }
                );
                const link = `${config.baseUrl}/api/v1/document/download/${downloadToken}`;
                return Result.Ok(link);
            })
            .mapErr((err) => {
                this.logger.error("Download link generation failed", { documentId, error: err.message });
                return err;
            })
            .toPromise();
    }

    async download(downloadToken: string): Promise<Result<{ fileName: string, filePath: string }, AppError>> {

        let decoded;
        try {
            decoded = jwt.verify(downloadToken, config.downloadToken.secret) as { documentId: string };
        } catch (error: any) {
            const message = error.name === "TokenExpiredError" ? "Download token expired" : "Invalid download token";
            this.logger.warn("Download token rejected", { reason: message });
            return Result.Err(unauthorized(message));
        }

        return Result.Ok(decoded.documentId)
            .flatMap(async(documentId) => await this.repo.findById(documentId))
            .flatMap((document) => {
                const filePath = path.join("public", document.filePath);
                const fileName = `${document.title}${path.extname(filePath)}`;

                return fs.existsSync(filePath)
                    ? Result.Ok({ fileName, filePath })
                    : Result.Err(notFound("File not found on server"));
            })
            .mapErr((err) => {
                this.logger.error("Download failed", { error: err.message });
                return err;
            })
            .toPromise();
    }
}