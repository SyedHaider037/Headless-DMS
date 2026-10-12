import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config.js";

const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: false
});

const db = drizzle(pool);

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('Database connected successfully');
        client.release();
    } catch (err) {
        console.error('Failed to connect to database', err);
        process.exit(1); 
    }
}

testConnection();

export { db };


