export interface IDocumentRepository {
    create(data: {title: string, description?: string, tag: string,authorId: string, filePath: string, fileType: string}) :Promise<any>;
    findAll(): Promise<any>;
    findById(documentId: string): Promise<any>
    delete(documentId: string): Promise<any>
    update(id: string, data: { title?: string; description?: string; tag?: string }): Promise<any>
    search(title?: string, tag?: string, authorId?: string): Promise<any>;
}