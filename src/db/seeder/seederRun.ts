import { seedRoleAndPermission } from "./seedRolesandPermissions";

seedRoleAndPermission()
    .then((result) => {
        console.log("Success", result);
        process.exit(0);
    })
    .catch((err) => {
        console.error(" Seeding error:", err);
        process.exit(1);
    });
