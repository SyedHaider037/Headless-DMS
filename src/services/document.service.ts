import path  from "path";
import jwt, { SignOptions } from "jsonwebtoken";
import fs from "fs";
import { CreateDocumentDTO, UpdateDocumentDTO, SearchDocumentsDTO} from "../dtos/document.dto.js";
import { IDocumentRepository } from "../interfaces/document.interface.js";
import { Result } from "@carbonteq/fp";
import { config } from "../config.js";

export class DocumentService {
    constructor(private readonly repo: IDocumentRepository) {}

    async upload(data: CreateDocumentDTO) : Promise<Result<any, string>> {
        const { title, tag, userId, filePath, fileType, description } = data;

        return Result.Ok(data)
            .flatMap(async(d) => await this.repo.create({
                title: d.title,
                description: d.description,
                tag: d.tag,
                authorId: d.userId,
                filePath: d.filePath,
                fileType: d.fileType,
            }))
            .mapErr((err) => {
                console.error(`upload failed for user${userId}: ${err}`);
                return err;
            })
            .toPromise();
    }

    async getAll(): Promise<Result<any[], string>> {

        return Result.Ok(null)
            .flatMap(async() => await this.repo.findAll())
            .flatMap((docs) => docs.length > 0
                ? Result.Ok(docs)
                : Result.Err("No documents found"))
            .mapErr((err) => {
                console.error(`getAll failed: ${err}`);
                return err;
            })
            .toPromise();
        
    }

    async getById(documentId: string): Promise<Result<any, string>> {

        return Result.Ok(documentId)
            .flatMap(async(docId) => await this.repo.findById(docId))
            .mapErr((err) => {
                console.error(`get document by id failed: ${err}`);
                return err;
            })
            .toPromise();
    }

    async deleteById(documentId: string): Promise<Result<any, string>> {

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
                        if (err) console.error("Failed to delete file", err);
                    });
                    return { deletedDocument: deleted, filePath };
                });
            })
            .mapErr((err) => {
                console.error(`delete document failed: ${err}`);
                return err;
            })
            .toPromise();
    }

    async updateById(data: UpdateDocumentDTO): Promise<Result<any, string>> {
        const { documentId, title, description, tag } = data;

        return Result.Ok(documentId)
            .flatMap(async () => await this.repo.findById(documentId))
            .flatMap(async () => await this.repo.update(documentId, {title, description, tag}))
            .mapErr((err) => {
                console.error(`update document failed: ${err}`);
                return err;
            })
            .toPromise();
    }

    async search(data: SearchDocumentsDTO): Promise<Result<any[], string>> {

        return Result.Ok(data)
            .flatMap(async (data) => await this.repo.search(data.title, data.tag, data.authorId))
            .flatMap((results) => results.length > 0
                ? Result.Ok(results)
                : Result.Err("No documents match the search"))
            .mapErr((err) => {
                console.log(`search document failed ${err}`);
                return err;
            })
            .toPromise();
    }

    async downloadLink(documentId: string): Promise<Result<string, string>> {

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
                console.error(`download link generation failed: ${err}`);
                return err;
            })
            .toPromise();
    }

    async download(downloadToken: string): Promise<Result<{ fileName: string, filePath: string }, string>> {

        let decoded;
        try {
            decoded = jwt.verify(downloadToken, config.downloadToken.secret) as { documentId: string };
        } catch (error: any) {
            const message = error.name === "TokenExpiredError" ? "Download token expired" : "Invalid download token";
            console.error(`download failed: ${message}`);
            return Result.Err(message);
        }

        return Result.Ok(decoded.documentId)
            .flatMap(async(documentId) => await this.repo.findById(documentId))
            .flatMap((document) => {
                const filePath = path.join("public", document.filePath);
                const fileName = `${document.title}${path.extname(filePath)}`;

                return fs.existsSync(filePath)
                    ? Result.Ok({ fileName, filePath })
                    : Result.Err("File not found on server");
            })
            .mapErr((err) => {
                console.error(`download failed: ${err}`);
                return err;
            })
            .toPromise();
    }
}