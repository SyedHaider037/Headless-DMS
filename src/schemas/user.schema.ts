import { uuid, pgTable, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { roles } from "./role.schema";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length : 255 }).notNull(),
    roleId: uuid("roleId").references(() => roles.id).notNull(),
    refreshToken: text("refreshToken"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});