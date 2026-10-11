import { Result } from "@carbonteq/fp";

export interface IDocumentRepository {
    create(data: {title: string, description?: string, tag: string,authorId: string, filePath: string, fileType: string}) :Promise<Result<any, string>>;
    findAll(): Promise<Result<any[], string>>;
    findById(documentId: string): Promise<Result<any,string>>;
    delete(documentId: string): Promise<Result<any, string>>;
    update(id: string, data: { title?: string; description?: string; tag?: string }): Promise<Result<any, string>>;
    search(title?: string, tag?: string, authorId?: string): Promise<Result<any[], string>>;
}