import { pino, Logger } from "pino";
import { ILogger, LogMeta } from "../interfaces/logger.interface.js";

const SENSITIVE_KEYS = ["password", "token", "accessToken", "refreshToken", "authorization", "cookie"];

// top-level keys, one nesting level, and the common express request headers
const REDACT_PATHS = [
    ...SENSITIVE_KEYS,
    ...SENSITIVE_KEYS.map((key) => `*.${key}`),
    "req.headers.authorization",
    "req.headers.cookie",
];

export interface PinoLoggerOptions {
    level: string;
    pretty: boolean;
}

export class PinoLogger implements ILogger {
    private readonly logger: Logger;

    constructor({ level, pretty }: PinoLoggerOptions) {
        this.logger = pino({
            level,
            redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
            ...(pretty ? { transport: { target: "pino-pretty" } } : {}),
        });
    }

    debug(message: string, meta?: LogMeta): void {
        this.log("debug", message, meta);
    }

    info(message: string, meta?: LogMeta): void {
        this.log("info", message, meta);
    }

    warn(message: string, meta?: LogMeta): void {
        this.log("warn", message, meta);
    }

    error(message: string, meta?: LogMeta): void {
        this.log("error", message, meta);
    }

    private log(level: "debug" | "info" | "warn" | "error", message: string, meta?: LogMeta): void {
        if (meta) {
            this.logger[level](meta, message);
        } else {
            this.logger[level](message);
        }
    }
}
