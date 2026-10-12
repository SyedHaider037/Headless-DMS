import { seedRoleAndPermission } from "./seedRolesandPermissions.js";
import { container } from "../../container.js";

seedRoleAndPermission()
    .then((result) => {
        container.logger.info("Seeding finished");
        process.exit(0);
    })
    .catch((err) => {
        container.logger.error("Seeding failed", { error: err instanceof Error ? err.message : String(err) });
        process.exit(1);
    });
