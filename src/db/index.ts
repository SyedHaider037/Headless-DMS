import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config.js";
import { ILogger } from "../interfaces/logger.interface.js";

const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: false
});

const db = drizzle(pool);

async function testConnection(logger: ILogger) {
    try {
        const client = await pool.connect();
        logger.info('Database connected successfully');
        client.release();
    } catch (err) {
        logger.error('Failed to connect to database', { error: err instanceof Error ? err.message : String(err) });
        process.exit(1); 
    }
}

// ends the pool so short-lived commands (migrate, seed) can exit
async function closeDatabase() {
    await pool.end();
}

export { db, testConnection, closeDatabase };


