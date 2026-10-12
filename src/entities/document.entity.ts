export interface Document {
    id: string;
    title: string;
    description: string | null;
    tag: string;
    filePath: string;
    fileType: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
}

// what clients may see: the server-side file path stays private
export type PublicDocument = Omit<Document, "filePath">;

export interface NewDocument {
    title: string;
    description?: string;
    tag: string;
    authorId: string;
    filePath: string;
    fileType: string;
}

export interface DocumentChanges {
    title?: string;
    description?: string;
    tag?: string;
}
