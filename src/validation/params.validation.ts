import { z } from "zod";

// shared UUID check: the label makes the message say which value was wrong
export const uuidSchema = (label: string) => z.uuid(`${label} must be a valid UUID`);

export const documentIdParamsSchema = z.object({
    id: uuidSchema("Document id"),
});

export const downloadTokenParamsSchema = z.object({
    token: z.string("Download token is required").min(1, "Download token is required"),
});
