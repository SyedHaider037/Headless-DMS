import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { roles } from "./role.schema";
import { permissions } from "./permission.schema";  

export const rolePermissions = pgTable("rolePermissions", {
    id: uuid("id").primaryKey().defaultRandom(),
    roleId: uuid("roleId").references(() => roles.id).notNull(),
    permissionId: uuid("permissionId").references(() => permissions.id).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});