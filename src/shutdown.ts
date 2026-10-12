import type { Server } from "http";
import { ILogger } from "./interfaces/logger.interface.js";

export interface ShutdownOptions {
    logger: ILogger;
    // closes what the server depends on, for example the database pool
    cleanup: () => Promise<void>;
    // how long to wait for in-flight requests before giving up
    timeoutMs?: number;
    // called with the exit code once shutdown finished; by default it sets process.exitCode
    onExit?: (code: number) => void;
}

// stops accepting requests, lets in-flight ones finish, closes the cleanup resources, then exits
export const registerGracefulShutdown = (server: Server, { logger, cleanup, timeoutMs = 10_000, onExit }: ShutdownOptions) => {
    let shuttingDown = false;
    let timedOut = false;
    const exit = onExit ?? ((code: number) => { process.exitCode = code; });

    const shutdown = (signal: string): Promise<void> => {
        if (shuttingDown) return Promise.resolve();
        shuttingDown = true;
        logger.info("Shutting down", { signal });

        return new Promise<void>((resolve) => {
            const timer = setTimeout(() => {
                timedOut = true;
                logger.error("Shutdown timed out; forcing exit", { timeoutMs });
                server.closeAllConnections();
            }, timeoutMs);
            timer.unref();

            server.close(async (closeError) => {
                clearTimeout(timer);
                let code = closeError || timedOut ? 1 : 0;
                if (closeError) logger.error("Closing the server failed", { error: closeError.message });
                try {
                    await cleanup();
                } catch (error) {
                    code = 1;
                    logger.error("Cleanup failed", { error: error instanceof Error ? error.message : String(error) });
                }
                logger.info("Shutdown complete", { code });
                exit(code);
                resolve();
            });
            // keep-alive connections that are idle would hold the server open
            server.closeIdleConnections();
        });
    };

    process.once("SIGTERM", () => void shutdown("SIGTERM"));
    process.once("SIGINT", () => void shutdown("SIGINT"));

    return shutdown;
};
