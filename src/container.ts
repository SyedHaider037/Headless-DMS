import { config } from "./config.js";
import { ILogger } from "./interfaces/logger.interface.js";
import { PinoLogger } from "./logging/pino.logger.js";
import { DocumentRepository } from "./repositories/document.repository.js";
import { PermissionRepository } from "./repositories/permission.repository.js";
import { UserRepository } from "./repositories/user.repository.js";
import { AuthService } from "./services/auth.service.js";
import { DocumentService } from "./services/document.service.js";
import { PermissionService } from "./services/permission.service.js";
import { UserService } from "./services/user.service.js";

// composition root: the only place where concrete classes are wired together
const logger: ILogger = new PinoLogger({ level: config.logLevel, pretty: !config.isProduction });

const documentRepository = new DocumentRepository();
const permissionRepository = new PermissionRepository();
const userRepository = new UserRepository();

export const container = {
    logger,
    authService: new AuthService(userRepository),
    documentService: new DocumentService(documentRepository),
    permissionService: new PermissionService(permissionRepository),
    userService: new UserService(userRepository),
};
