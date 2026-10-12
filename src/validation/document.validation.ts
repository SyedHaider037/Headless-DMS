import { z } from "zod"
import { paginationSchema } from "./pagination.validation.js";
import { uuidSchema } from "./params.validation.js";
import { FILE_TYPE_NAMES, mimeTypeForFileType } from "./upload.validation.js";

export const createDocumentSchema = z.object({
    title: z.string().min(8, "Title should be al least 8 characters long"),
    description: z.string().optional(),
    tag: z.string().min(5,"Tag is required"),    
});

export const updateDocumentSchema = z.object({
    title: z.string().min(8, "Title should be al least 8 characters long").optional(),
    description: z.string().optional(),
    tag: z.string().min(5,"Tag is required").optional(),
});      

export const listDocumentsQuerySchema = paginationSchema;

const startOfDay = (value: string) => new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
// a date without a time means the whole day, so createdTo includes it entirely
const endOfDay = (value: string) => new Date(value.length === 10 ? `${value}T23:59:59.999Z` : value);

const dateInput = (label: string) => z.union(
    [z.iso.date(), z.iso.datetime({ offset: true })],
    `${label} must be a date (YYYY-MM-DD) or an ISO 8601 date-time`,
);

export const searchDocumentsQuerySchema = z.object({
    title: z.string().trim().min(1, "title must not be empty").optional(),
    tag: z.string().trim().min(1, "tag must not be empty").optional(),
    authorId: uuidSchema("authorId").optional(),
    createdFrom: dateInput("createdFrom").transform(startOfDay).optional(),
    createdTo: dateInput("createdTo").transform(endOfDay).optional(),
    fileType: z.enum(FILE_TYPE_NAMES, `fileType must be one of: ${FILE_TYPE_NAMES.join(", ")}`).transform(mimeTypeForFileType).optional(),
    sortBy: z.enum(["createdAt", "title"], "sortBy must be createdAt or title").default("createdAt"),
    sortOrder: z.enum(["asc", "desc"], "sortOrder must be asc or desc").default("desc"),
    ...paginationSchema.shape,
}).refine((query) => !query.createdFrom || !query.createdTo || query.createdFrom <= query.createdTo, {
    message: "createdFrom must not be after createdTo",
    path: ["createdFrom"],
});
