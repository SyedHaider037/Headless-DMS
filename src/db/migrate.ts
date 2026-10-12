import path from "path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index.js";
import { ILogger } from "../interfaces/logger.interface.js";

// applies the SQL migrations in ./drizzle (relative to the working directory)
export const runMigrations = async (logger: ILogger): Promise<void> => {
    const migrationsFolder = path.join(process.cwd(), "drizzle");
    await migrate(db, { migrationsFolder });
    logger.info("Migrations applied", { migrationsFolder });
};
