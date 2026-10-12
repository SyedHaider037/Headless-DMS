import { z } from "zod";
import { Result } from "@carbonteq/fp";
import { AppError, validation } from "../errors/app-error.js";

// Zod only checks shape and format; its first message becomes the typed Validation error
export const parseInput = <S extends z.ZodType>(schema: S, input: unknown): Result<z.output<S>, AppError> => {
    const parsed = schema.safeParse(input);
    return parsed.success
        ? Result.Ok(parsed.data)
        : Result.Err(validation(parsed.error.issues[0]?.message ?? "Invalid input"));
};
