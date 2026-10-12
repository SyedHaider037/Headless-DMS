import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    ACCESS_TOKEN_SECRET: z.string().min(1),
    REFRESH_TOKEN_SECRET: z.string().min(1),
    DOWNLOAD_TOKEN_SECRET: z.string().min(1),
    ACCESS_TOKEN_EXPIRY: z.string().min(1),
    REFRESH_TOKEN_EXPIRY: z.string().min(1),
    BASE_URL: z.string().min(1),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    DOWNLOAD_LINK_EXPIRY: z.string().min(1).default("10m"),
    BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(10),
    MAX_UPLOAD_MB: z.coerce.number().positive().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    // names only: never print the values of environment variables
    const names = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Invalid environment configuration. Missing or invalid variables: ${names.join(", ")}`);
}

const env = parsed.data;

export const config = {
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === "production",
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    baseUrl: env.BASE_URL,
    logLevel: env.LOG_LEVEL,
    bcryptCost: env.BCRYPT_COST,
    maxUploadMb: env.MAX_UPLOAD_MB,
    accessToken: { secret: env.ACCESS_TOKEN_SECRET, expiry: env.ACCESS_TOKEN_EXPIRY },
    refreshToken: { secret: env.REFRESH_TOKEN_SECRET, expiry: env.REFRESH_TOKEN_EXPIRY },
    downloadToken: { secret: env.DOWNLOAD_TOKEN_SECRET, expiry: env.DOWNLOAD_LINK_EXPIRY },
} as const;
