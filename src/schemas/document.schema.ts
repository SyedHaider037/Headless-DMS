import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const documents = pgTable("documents", {
    id: uuid("id").primaryKey().defaultRandom(),    
    title: varchar("title", { length: 255 }).notNull(),
    description : text("description"),
    tag: varchar("tag", { length: 255 }).notNull(),
    filePath: varchar("filePath", { length: 255 }).notNull(),
    fileType: varchar("fileType", {length: 100}).notNull(), 
    authorId: uuid("authorId").references(() => users.id ).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),   
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});