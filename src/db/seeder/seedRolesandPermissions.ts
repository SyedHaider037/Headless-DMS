import { db } from "../index.js";
import { roles } from "../../schemas/role.schema.js";
import { permissions } from "../../schemas/permission.schema.js";  
import { rolePermissions } from "../../schemas/rolePermission.schema.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { container } from "../../container.js";
import { missingPairs, RolePermissionPair } from "./rolePermissionPairs.js";
import { Role } from "../../entities/role.entity.js";
import { Permission } from "../../entities/permission.entity.js";

const { logger } = container;

const roleData = [
    { name: "ADMIN" },
    { name: "USER" },
];

const permissionData = [
    { action: "CREATE_DOCUMENT", description: "Can upload the document" },
    { action: "READ_DOCUMENT", description: "Can view the document" },
    { action: "UPDATE_DOCUMENT", description: "Can update the document" },
    { action: "DELETE_DOCUMENT", description: "Can delete the document" },
    { action: "MANAGE_PERMISSIONS", description: "Can manage the document" },
];

const rolePermissionMap: Record<string, string[]> = {
    ADMIN: [
        "CREATE_DOCUMENT",
        "READ_DOCUMENT",
        "UPDATE_DOCUMENT",
        "DELETE_DOCUMENT",
        "MANAGE_PERMISSIONS",
    ],
    USER: [
        "CREATE_DOCUMENT",
        "READ_DOCUMENT",
        "UPDATE_DOCUMENT",
        "DELETE_DOCUMENT",
    ],
};

export const seedRoleAndPermission = async () => {
    // await db.delete(rolePermissions);
    // await db.delete(roles);
    // await db.delete(permissions);

    const insertedRoles = await Promise.all(
        roleData.map(async (role) => {
            const [existing] = await db.select().from(roles).where(eq(roles.name, role.name));
            if (existing) return existing;
            const [inserted] = await db.insert(roles).values(Role.create(role).unwrap().toPersistence()).returning();
            return inserted;
        })
    );

    logger.info("Roles seeded", { count: insertedRoles.length });

    const insertedPermissions = await Promise.all(
        permissionData.map(async (perm) => {
            const [existing] = await db.select().from(permissions).where(eq(permissions.action, perm.action));
            if (existing) return existing;
            const [inserted] = await db.insert(permissions).values(Permission.create(perm).unwrap().toPersistence()).returning();
            return inserted;
        })
    );

    logger.info("Permissions seeded", { count: insertedPermissions.length });

    const wanted: RolePermissionPair[] = [];
    for (const role of insertedRoles) {
        const allowedActions = rolePermissionMap[role.name as keyof typeof rolePermissionMap] || [];

        for (const action of allowedActions) {
            const permission = insertedPermissions.find((p) => p.action === action);
            if (!permission) continue;
            wanted.push({ roleId: role.id, permissionId: permission.id });
        }
    }

    // only insert pairs that are not stored yet, so running the seed twice adds nothing
    const existing = await db
        .select({ roleId: rolePermissions.roleId, permissionId: rolePermissions.permissionId })
        .from(rolePermissions);
    const toInsert = missingPairs(wanted, existing);
    for (const pair of toInsert) {
        await db.insert(rolePermissions).values({ id: randomUUID(), ...pair });
    }
    logger.info("Role-permission pairs added", { added: toInsert.length, alreadyPresent: wanted.length - toInsert.length });

    logger.info("Roles and permissions seeded successfully");
};
