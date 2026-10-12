import { and, asc, desc, eq, gte, ilike, lte, SQL } from "drizzle-orm";
import { documents } from "../schemas/document.schema.js";
import { DocumentFilters, DocumentSort } from "../entities/document.entity.js";

// LIKE wildcards typed by the user must match literally
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

// every filter that is present narrows the result (AND); no filters means everything
export const buildDocumentConditions = (filters: DocumentFilters): SQL | undefined => {
    const conditions: SQL[] = [];
    if (filters.title) conditions.push(ilike(documents.title, `%${escapeLike(filters.title)}%`));
    if (filters.tag) conditions.push(ilike(documents.tag, `%${escapeLike(filters.tag)}%`));
    if (filters.authorId) conditions.push(eq(documents.authorId, filters.authorId));
    if (filters.createdFrom) conditions.push(gte(documents.createdAt, filters.createdFrom));
    if (filters.createdTo) conditions.push(lte(documents.createdAt, filters.createdTo));
    if (filters.fileType) conditions.push(eq(documents.fileType, filters.fileType));
    return and(...conditions);
};

// id is the tie-breaker so pages never overlap or skip rows
export const buildDocumentOrder = ({ sortBy, sortOrder }: DocumentSort): SQL[] => {
    const direction = sortOrder === "asc" ? asc : desc;
    const column = sortBy === "title" ? documents.title : documents.createdAt;
    return [direction(column), direction(documents.id)];
};
