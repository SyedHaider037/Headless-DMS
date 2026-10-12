# Headless Document Management System (DMS)

A headless (API-only) backend for uploading, searching and sharing documents with JWT authentication and role-based access.

## Tech stack

- Node.js (>= 20) and Express 5, written in TypeScript (ES modules)
- PostgreSQL with Drizzle ORM
- Zod for input validation (shape and format only)
- `@carbonteq/fp` `Result` for error handling (no throwing in services)
- pino for logging, behind an `ILogger` interface
- JWT (access, refresh and download tokens), bcrypt for passwords, multer for uploads
- commander for the command line (`serve`, `migrate`, `seed`)

## Install and run

```bash
npm install
cp .env.example .env        # then fill in the values
npm run migrate             # create the tables from drizzle/
npm run seed                # roles, permissions and (optionally) the first admin
npm run dev                 # development, restarts on change
```

Run `npm run seed` before registering anyone: registration looks up the `USER` role and fails if it does not exist.

Production: `npm run build`, then `npm start`. On a built copy use `npm run migrate:prod` and `npm run seed:prod`.

### Commands

The app is one CLI (`src/index.ts`, built to `dist/index.js`):

| Command | What it does |
|---|---|
| `serve` (default) | checks the database, then listens on `PORT` |
| `migrate` | applies the SQL migrations in `drizzle/` |
| `seed` | creates the roles, permissions and their mapping, then the admin user if configured |

`node dist/index.js --help` lists them and works without any environment variables.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | `serve` from source with `tsx watch` |
| `npm run build` | compiles to `dist/` with `tsc` |
| `npm start` | `node dist/index.js serve` |
| `npm run migrate` / `npm run migrate:prod` | `migrate` from source / from `dist/` |
| `npm run seed` / `npm run seed:prod` | `seed` from source / from `dist/` |
| `npm run drizzle:generate` | generates a migration from `src/schemas` |
| `npm run drizzle:migrate` | applies migrations with drizzle-kit (the `migrate` command does the same without it) |

### Environment variables

Names only; see `.env.example` for placeholders. The app stops at startup and lists the names of any missing or invalid variable.

- Required: `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `DOWNLOAD_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`, `BASE_URL`
- Optional, with defaults: `NODE_ENV` (development), `PORT` (3000), `LOG_LEVEL` (info), `DOWNLOAD_LINK_EXPIRY` (10m), `BCRYPT_COST` (10), `MAX_UPLOAD_MB` (5), `DB_POOL_MAX` (10)
- First admin, read by `seed`: `ADMIN_USERNAME` (default `administrator`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Only for docker compose: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

Cookies are marked `secure` only when `NODE_ENV` is `production`.

### First admin

Registration always creates a `USER`. To get an `ADMIN`, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 8 characters) and run `seed`. The username must be at least 8 characters (default `administrator`). If the email or username already exists the seed leaves that account unchanged and never overwrites a password; if the variables are missing it logs which names to set and skips. Running `seed` twice is safe: it adds no duplicate role-permission rows.

## Docker (not yet verified)

`Dockerfile` (multi-stage, Node 22, runs as the non-root `node` user), `.dockerignore` and `docker-compose.yml` (the app plus Postgres, with named volumes for the database and for uploads) are included, but they have not been run yet: Docker was not available where they were written.

```bash
cp .env.example .env        # set POSTGRES_PASSWORD (URL-safe characters) and the secrets
docker compose up --build
docker compose run --rm app node dist/index.js migrate
docker compose run --rm app node dist/index.js seed
```

Compose sets `NODE_ENV=production`, so cookies are `secure`: use HTTPS in front of it, or send the access token in the `Authorization: Bearer` header.

## Endpoints

All routes are under `/api/v1`. Send the access token as the `accessToken` cookie or as `Authorization: Bearer <token>`.

### User

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/user/register` | no | `username` (at least 8 characters), `email`, `password` (at least 8). Always creates a `USER`; any `role` sent is ignored |
| POST | `/user/login` | no | `email`, `password`. Sets the `accessToken` and `refreshToken` cookies |
| POST | `/user/logout` | yes | clears the cookies and the stored refresh token |
| POST | `/user/refreshToken` | refresh cookie | issues a new access and refresh token; the old refresh token stops working |

### Document

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/document` | yes | multipart form: `file`, `title`, `tag`, optional `description` |
| GET | `/document` | yes | paginated list: `?page=1&limit=20` (limit max 100) |
| GET | `/document/search` | yes | filters below |
| GET | `/document/:id` | yes | one document (`:id` must be a UUID) |
| PATCH | `/document/:id` | yes, owner or ADMIN | `title`, `description`, `tag` |
| DELETE | `/document/:id` | yes, owner or ADMIN | also deletes the stored file |
| GET | `/document/:id/download` | yes | returns a short-lived download link |
| GET | `/document/download/:token` | no, the token is the credential | streams the file |

Documents have a title of 8 to 255 characters, a tag of 5 to 255 and an optional description of up to 2000.

### Upload limits

Only `pdf`, `txt`, `docx`, `png` and `jpg`/`jpeg` are accepted: both the extension and the mimetype must match. The maximum size is `MAX_UPLOAD_MB` (default 5). A rejected upload answers 400 and leaves no file on disk.

### Search

`GET /document/search` combines every filter you send with AND; with no filter it returns everything. Filters:

| Filter | Meaning |
|---|---|
| `title`, `tag` | partial, case-insensitive match |
| `authorId` | exact, a UUID |
| `createdFrom`, `createdTo` | inclusive; `YYYY-MM-DD` (a whole day) or an ISO 8601 date-time |
| `fileType` | one of `pdf`, `txt`, `docx`, `png`, `jpg`, `jpeg` (matched on the stored mimetype) |
| `sortBy`, `sortOrder` | `createdAt` (default) or `title`; `desc` (default) or `asc` |
| `page`, `limit` | pagination, default 1 and 20, limit max 100 |

List and search answer with `documents: { items, total, page, limit, totalPages }`. Responses never include the server file path, password hash or refresh token.

### Errors

Every error answers `{ "error": "<message>" }`, with no extra fields. Body, query and parameter validation errors also return only `{ "error": "<first message>" }` (no `details` list).

| Status | Meaning |
|---|---|
| 400 | validation failed (shape, format, or an entity rule such as a too-short title) |
| 401 | missing, expired or invalid token, or wrong credentials |
| 403 | not allowed |
| 404 | not found |
| 409 | user already exists |
| 500 | internal error (generic message; details are in the logs) |

## Roles and access

| Action | ADMIN | USER |
|---|---|---|
| Upload a document | yes | yes |
| Read, list and search all documents | yes | yes |
| Download a document (via link) | yes | yes |
| Update or delete a document | any document | only their own |

Any logged-in user can read all documents. There are two roles, created by `seed`.

## Architecture

`routes` -> `controllers` -> `services` -> repository interfaces (`src/interfaces`) -> repositories (`src/repositories`, the only place that uses Drizzle).

- **Composition root.** `src/container.ts` creates the repositories, services, logger and auth pieces once. `createApp(container)` in `src/app.ts` only builds the Express app; the CLI in `src/cli.ts` starts it. Controllers and middlewares still import the shared container directly.
- **Entities.** `Document`, `User`, `Role` and `Permission` in `src/entities` are classes with a private constructor. They are created only through `Entity.create(...)` (a new one: the application generates the id with `crypto.randomUUID()` and the timestamps) or `Entity.fromPersistence(...)` (one loaded from the store). Every change goes through a method such as `document.rename(...)`, which enforces the rules and returns a `Result`. Entities import nothing from Express, Drizzle, JWT, bcrypt or pino. Repositories map rows to entities and back.
- **Validation.** Zod (`src/validation`) checks only shape and format. Business rules live in the entities and services (title and tag lengths, ownership, duplicate users, the password policy).
- **Errors.** Typed `AppError` values (NotFound, Conflict, Unauthorized, Forbidden, Validation, Internal) travel inside `Result.Err` and are mapped to HTTP statuses in one place.
- **Auth abstraction.** The auth middleware depends on `IAuthHandler`; tokens go through `ITokenService` and hashing through `IPasswordHasher`. The JWT and bcrypt implementations are in `src/auth`; nothing else imports `jsonwebtoken` or `bcrypt`. Every refresh token carries a unique `jti`, and refresh tokens are rotated: reusing an old one answers 401.

## Twelve-factor notes

- **Codebase and dependencies:** one repository; dependencies are declared in `package.json` with a lockfile and `engines` (`node >= 20`).
- **Config:** everything comes from environment variables, read and validated in one place (`src/config.ts`), failing fast with the names of missing variables.
- **Backing services:** Postgres is reached through `DATABASE_URL`.
- **Processes:** no per-user or per-request state is kept in memory; uploaded files are the one exception (see limitations).
- **Port binding:** the app listens on `PORT` itself and needs no external web server.
- **Concurrency:** scale out by running more processes; each opens at most `DB_POOL_MAX` database connections.
- **Disposability:** on SIGTERM or SIGINT the server stops accepting requests, lets in-flight ones finish, closes the database pool, then exits (a timeout forces it).
- **Logs:** structured JSON on stdout through pino (pretty-printed outside production); passwords, tokens, authorization and cookie values are redacted.

## Design decisions

- **No per-document permission endpoint, on purpose.** Access control is coarse RBAC: an ADMIN can do everything, a USER can change only their own documents. Granting individual users rights on a document would create second owners, which is fine-grained access control this project does not want. `MANAGE_PERMISSIONS` is seeded but not used.
- **Download links are public, short-lived tokens.** `GET /document/:id/download` requires a login and returns a link containing a signed JWT (expiry set by `DOWNLOAD_LINK_EXPIRY`, 10 minutes by default). The download route itself needs no login; the token is the credential.
- **A missing document or role in a permission check answers 403**, and only a real database failure answers 500.
- **Empty lists are normal.** An empty list or search answers 200 with `total: 0`.
- **Ids are created by the application**, not by the database. The table definitions still declare a database default, which is simply never used.

## Known limitations

- No automated tests yet.
- Uploaded files live on the local disk (`public/uploads`). Running several instances therefore needs shared storage for that folder.
- A second document store (another implementation of the repository interface) is not built yet.
- The Docker setup has not been run.
- Logging out does not revoke an access token that is still valid; it stops working when it expires.
- `npm audit` reports advisories in some dependencies (including `multer` and `drizzle-orm`); they have not been upgraded yet.
- There is no dedicated health-check endpoint; `GET /` is used.

## What I would build next

- Automated tests.
- Shared storage for uploads, so several instances can run.
- A second document store behind the existing repository interface.
- Dependency upgrades after reviewing `npm audit`.
- A health endpoint that also checks the database.
