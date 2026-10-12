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

export interface DocumentFilters {
    title?: string;
    tag?: string;
    authorId?: string;
    createdFrom?: Date;
    createdTo?: Date;
    fileType?: string;
}

export interface DocumentSort {
    sortBy: "createdAt" | "title";
    sortOrder: "asc" | "desc";
}

export const DEFAULT_DOCUMENT_SORT: DocumentSort = { sortBy: "createdAt", sortOrder: "desc" };

export interface DocumentChanges {
    title?: string;
    description?: string;
    tag?: string;
}
