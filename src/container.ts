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
import { JwtTokenService } from "./auth/jwt-token.service.js";
import { BcryptPasswordHasher } from "./auth/bcrypt-password.hasher.js";
import { JwtAuthHandler } from "./auth/jwt-auth.handler.js";

// composition root: the only place where concrete classes are wired together
const logger: ILogger = new PinoLogger({ level: config.logLevel, pretty: !config.isProduction });

const documentRepository = new DocumentRepository();
const permissionRepository = new PermissionRepository();
const userRepository = new UserRepository();

const tokenService = new JwtTokenService({
    access: config.accessToken,
    refresh: config.refreshToken,
    download: config.downloadToken,
});
const passwordHasher = new BcryptPasswordHasher(config.bcryptCost);
const authService = new AuthService(userRepository, logger);

export const container = {
    logger,
    userRepository,
    tokenService,
    passwordHasher,
    authService,
    authHandler: new JwtAuthHandler(tokenService, authService),
    documentService: new DocumentService(documentRepository, tokenService, logger),
    permissionService: new PermissionService(permissionRepository, logger),
    userService: new UserService(userRepository, tokenService, passwordHasher, logger),
};

export type Container = typeof container;
