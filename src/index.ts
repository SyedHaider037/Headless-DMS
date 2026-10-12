import {app}  from "./app.js"
import { config } from "./config.js";
import { container } from "./container.js";
import { testConnection } from "./db/index.js";

const { logger } = container;

await testConnection(logger);

app.listen(config.port, () => {
    logger.info(`Server is running on http://localhost:${config.port}`);
});
