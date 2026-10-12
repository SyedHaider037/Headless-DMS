import path  from "path";
import fs from "fs";
import { CreateDocumentDTO, UpdateDocumentDTO, SearchDocumentsDTO} from "../dtos/document.dto.js";
import { IDocumentRepository } from "../interfaces/document.interface.js";
import { Result } from "@carbonteq/fp";
import { config } from "../config.js";
import { ITokenService } from "../interfaces/token.interface.js";
import { ILogger } from "../interfaces/logger.interface.js";

import { AppError, notFound } from "../errors/app-error.js";
import { Document, DocumentSort } from "../entities/document.entity.js";
import { PaginatedCollection, PaginationOptions } from "../entities/pagination.entity.js";

export class DocumentService {
    constructor(private readonly repo: IDocumentRepository, private readonly tokens: ITokenService, private readonly logger: ILogger) {}

    async upload(data: CreateDocumentDTO) : Promise<Result<Document, AppError>> {
        return Result.Ok(data)
            .flatMap((d) => Document.create({
                title: d.title,
                description: d.description,
                tag: d.tag,
                authorId: d.userId,
                filePath: d.filePath,
                fileType: d.fileType,
            }))
            .flatMap(async(document) => await this.repo.save(document))
            .mapErr((err) => {
                this.logger.error("Document upload failed", { userId: data.userId, error: err.message });
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
            .flatMap(async(document) => {
                const filePath = path.join(process.cwd(), "public", document.filePath);
                const deletedDocument = await this.repo.delete(document.id);
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
            .flatMap((document) => {
                // every change goes through the entity, which enforces its own rules
                let changed: Result<Document, AppError> = Result.Ok(document);
                if (title !== undefined) changed = changed.flatMap((d) => d.rename(title));
                if (tag !== undefined) changed = changed.flatMap((d) => d.changeTag(tag));
                if (description !== undefined) changed = changed.flatMap((d) => d.changeDescription(description));
                return changed;
            })
            .flatMap(async (document) => await this.repo.update(document))
            .mapErr((err) => {
                this.logger.error("Document update failed", { documentId, error: err.message });
                return err;
            })
            .toPromise();
    }

    async search(data: SearchDocumentsDTO, options: PaginationOptions, sort?: DocumentSort): Promise<Result<PaginatedCollection<Document>, AppError>> {

        return Result.Ok(data)
            .flatMap(async (data) => await this.repo.search(data, options, sort))
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
                const downloadToken = this.tokens.createDownloadToken(documentId);
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

        return this.tokens.verifyDownloadToken(downloadToken)
            .flatMap(async({ documentId }) => await this.repo.findById(documentId))
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
