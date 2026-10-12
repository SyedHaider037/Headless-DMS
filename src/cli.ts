import { Command } from "commander";

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

// runs a command that must finish (migrate, seed): report failure with the exit code and always close the pool
const runOnce = async (name: string, task: (container: Awaited<typeof import("./container.js")>["container"]) => Promise<void>) => {
    const { container } = await import("./container.js");
    const { closeDatabase, testConnection } = await import("./db/index.js");
    try {
        await testConnection(container.logger);
        await task(container);
    } catch (error) {
        container.logger.error(`${name} failed`, { error: errorText(error) });
        process.exitCode = 1;
    } finally {
        await closeDatabase();
    }
};

export const createProgram = (): Command => {
    const program = new Command();
    program.name("headless-dms").description("Headless Document Management System");

    program
        .command("serve", { isDefault: true })
        .description("check the database, then listen on the configured PORT")
        .action(async () => {
            const { container } = await import("./container.js");
            const { config } = await import("./config.js");
            const { testConnection } = await import("./db/index.js");
            const { createApp } = await import("./app.js");

            await testConnection(container.logger);
            const app = createApp(container);
            app.listen(config.port, () => {
                container.logger.info(`Server is running on http://localhost:${config.port}`);
            });
        });

    program
        .command("migrate")
        .description("apply the SQL migrations in ./drizzle")
        .action(async () => {
            await runOnce("Migration", async (container) => {
                const { runMigrations } = await import("./db/migrate.js");
                await runMigrations(container.logger);
            });
        });

    program
        .command("seed")
        .description("create the roles, permissions and their mapping")
        .action(async () => {
            await runOnce("Seeding", async (container) => {
                const { seedRoleAndPermission } = await import("./db/seeder/seedRolesandPermissions.js");
                await seedRoleAndPermission();
                container.logger.info("Seeding finished");
            });
        });

    return program;
};
