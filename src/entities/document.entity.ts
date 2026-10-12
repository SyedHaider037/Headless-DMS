import { randomUUID } from "node:crypto";
import { Result } from "@carbonteq/fp";
import { AppError, validation } from "../errors/app-error.js";

// the persisted shape of a document: what a store hands to fromPersistence and gets back from toPersistence
export interface DocumentProps {
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
export type PublicDocument = Omit<DocumentProps, "filePath">;

const TITLE_MIN = 8;
const TITLE_MAX = 255;
const TAG_MIN = 5;
const TAG_MAX = 255;
const DESCRIPTION_MAX = 2000;

const checkTitle = (value: string): Result<string, AppError> => {
    const title = value.trim();
    if (title.length < TITLE_MIN) return Result.Err(validation(`Title must be at least ${TITLE_MIN} characters long`));
    if (title.length > TITLE_MAX) return Result.Err(validation(`Title must be at most ${TITLE_MAX} characters long`));
    return Result.Ok(title);
};

const checkTag = (value: string): Result<string, AppError> => {
    const tag = value.trim();
    if (tag.length < TAG_MIN) return Result.Err(validation(`Tag must be at least ${TAG_MIN} characters long`));
    if (tag.length > TAG_MAX) return Result.Err(validation(`Tag must be at most ${TAG_MAX} characters long`));
    return Result.Ok(tag);
};

// an empty description is stored as "no description"
const checkDescription = (value: string | null | undefined): Result<string | null, AppError> => {
    const description = value?.trim() || null;
    if (description && description.length > DESCRIPTION_MAX) {
        return Result.Err(validation(`Description must be at most ${DESCRIPTION_MAX} characters long`));
    }
    return Result.Ok(description);
};

const checkRequired = (value: string, label: string): Result<string, AppError> =>
    value.trim() ? Result.Ok(value) : Result.Err(validation(`${label} is required`));

export interface CreateDocumentInput {
    title: string;
    description?: string | null;
    tag: string;
    authorId: string;
    filePath: string;
    fileType: string;
}

export class Document {
    private constructor(private readonly props: DocumentProps) {}

    // a new document: the application creates the id and the timestamps
    static create(input: CreateDocumentInput): Result<Document, AppError> {
        const title = checkTitle(input.title);
        if (title.isErr()) return Result.Err(title.unwrapErr());
        const tag = checkTag(input.tag);
        if (tag.isErr()) return Result.Err(tag.unwrapErr());
        const description = checkDescription(input.description);
        if (description.isErr()) return Result.Err(description.unwrapErr());
        const authorId = checkRequired(input.authorId, "Author");
        if (authorId.isErr()) return Result.Err(authorId.unwrapErr());
        const filePath = checkRequired(input.filePath, "File path");
        if (filePath.isErr()) return Result.Err(filePath.unwrapErr());
        const fileType = checkRequired(input.fileType, "File type");
        if (fileType.isErr()) return Result.Err(fileType.unwrapErr());

        const now = new Date();
        return Result.Ok(new Document({
            id: randomUUID(),
            title: title.unwrap(),
            description: description.unwrap(),
            tag: tag.unwrap(),
            filePath: filePath.unwrap(),
            fileType: fileType.unwrap(),
            authorId: authorId.unwrap(),
            createdAt: now,
            updatedAt: now,
        }));
    }

    // a document read back from the store: it was validated when it was created, so it is trusted as is
    static fromPersistence(props: DocumentProps): Document {
        return new Document({ ...props });
    }

    get id(): string { return this.props.id; }
    get title(): string { return this.props.title; }
    get description(): string | null { return this.props.description; }
    get tag(): string { return this.props.tag; }
    get filePath(): string { return this.props.filePath; }
    get fileType(): string { return this.props.fileType; }
    get authorId(): string { return this.props.authorId; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }

    rename(title: string): Result<Document, AppError> {
        const checked = checkTitle(title);
        if (checked.isErr()) return Result.Err(checked.unwrapErr());
        this.props.title = checked.unwrap();
        return this.touched();
    }

    changeTag(tag: string): Result<Document, AppError> {
        const checked = checkTag(tag);
        if (checked.isErr()) return Result.Err(checked.unwrapErr());
        this.props.tag = checked.unwrap();
        return this.touched();
    }

    changeDescription(description: string | null): Result<Document, AppError> {
        const checked = checkDescription(description);
        if (checked.isErr()) return Result.Err(checked.unwrapErr());
        this.props.description = checked.unwrap();
        return this.touched();
    }

    isOwnedBy(userId: string): boolean {
        return this.props.authorId === userId;
    }

    toPublic(): PublicDocument {
        const { filePath: _filePath, ...publicProps } = this.props;
        return publicProps;
    }

    toPersistence(): DocumentProps {
        return { ...this.props };
    }

    private touched(): Result<Document, AppError> {
        this.props.updatedAt = new Date();
        return Result.Ok(this);
    }
}

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
