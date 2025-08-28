import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const  roles = pgTable("roles", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 50 }).notNull().unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});