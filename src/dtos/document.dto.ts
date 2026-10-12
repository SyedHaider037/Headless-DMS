export interface CreateDocumentDTO {
    title: string;
    tag: string;
    userId: string;
    filePath: string;
    fileType: string;
    description?: string; 
}

export interface UpdateDocumentDTO {
    documentId: string;
    title?: string;
    description?: string;
    tag?: string;
}

export interface SearchDocumentsDTO {
    title?: string;
    tag?: string;
    authorId?: string;
}
