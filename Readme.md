# Headless Document Management System (DMS)

A headless (API-only) backend for uploading, searching and sharing documents with JWT authentication and role-based access.

## Tech stack

- Node.js (>= 20) and Express 5, written in TypeScript (ES modules)
- PostgreSQL with Drizzle ORM
- Zod for input validation
- `@carbonteq/fp` `Result` for error handling (no throwing in services)
- pino for logging, behind an `ILogger` interface
- JWT (access, refresh and download tokens), bcrypt for passwords, multer for uploads

## Install and run

```bash
npm install
cp .env.example .env        # then fill in the values
npm run drizzle:migrate     # create the tables from drizzle/
npm run seed                # create the ADMIN and USER roles and their permissions
npm run dev                 # development, restarts on change
```

Run `npm run seed` before registering anyone: registration looks up the `USER` role and fails if it does not exist.

Production: `npm run build`, then `npm start`.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | runs `src/index.ts` with `tsx watch` |
| `npm run build` | compiles to `dist/` with `tsc` |
| `npm start` | runs `node dist/index.js` |
| `npm run seed` | seeds roles, permissions and the role-permission mapping |
| `npm run drizzle:generate` | generates a migration from `src/schemas` |
| `npm run drizzle:migrate` | applies the SQL migrations in `drizzle/` |

### Environment variables

Names only; see `.env.example` for placeholders. The app stops at startup and lists the names of any missing or invalid variable.

`NODE_ENV`, `PORT`, `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `DOWNLOAD_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`, `BASE_URL`, `LOG_LEVEL`, `DOWNLOAD_LINK_EXPIRY`, `BCRYPT_COST`

Cookies are marked `secure` only when `NODE_ENV` is `production`.

## Endpoints

All routes are under `/api/v1`. Send the access token as the `accessToken` cookie or as `Authorization: Bearer <token>`.

### User

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/user/register` | no | `username`, `email`, `password`. Always creates a `USER`; any `role` sent is ignored |
| POST | `/user/login` | no | `email`, `password`. Sets the `accessToken` and `refreshToken` cookies |
| POST | `/user/logout` | yes | clears the cookies and the stored refresh token |
| POST | `/user/refreshToken` | refresh cookie | issues a new access and refresh token |

### Document

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/document` | yes | multipart form: `file`, `title`, `tag`, optional `description` |
| GET | `/document` | yes | paginated list: `?page=1&limit=20` (limit max 100) |
| GET | `/document/search` | yes | `?title=&tag=&authorId=&page=&limit=` |
| GET | `/document/:id` | yes | one document |
| PATCH | `/document/:id` | yes, owner or ADMIN | `title`, `description`, `tag` |
| DELETE | `/document/:id` | yes, owner or ADMIN | also deletes the stored file |
| GET | `/document/:id/download` | yes | returns a short-lived download link |
| GET | `/document/download/:token` | no, the token is the credential | streams the file |

List and search answer with `documents: { items, total, page, limit, totalPages }`. Responses never include the server file path, password hash or refresh token.

### Errors

`400` validation, `401` missing, expired or invalid token or wrong credentials, `403` not allowed, `404` not found, `409` user already exists, `500` internal error (generic message; details are in the logs).

## Roles and access

| Action | ADMIN | USER |
|---|---|---|
| Upload a document | yes | yes |
| Read, list and search all documents | yes | yes |
| Download a document (via link) | yes | yes |
| Update or delete a document | any document | only their own |

Any logged-in user can read all documents. There are two roles, seeded by `npm run seed`. There is no endpoint that creates an `ADMIN`: registration always assigns `USER`, so an admin account has to be set up directly in the database.

## Architecture

`routes` -> `controllers` -> `services` -> repository interfaces (`src/interfaces`) -> repositories (`src/repositories`, the only place that uses Drizzle). `src/container.ts` is the composition root: it creates the repositories, services and logger once and hands them out. Services depend on interfaces, not on Drizzle. Entity types live in `src/entities`; errors are typed `AppError` values inside `Result.Err`.

## Design decisions

- **No per-document permission endpoint, on purpose.** Access control is coarse RBAC: an ADMIN can do everything, a USER can change only their own documents. Granting individual users rights on a document would create second owners, which is fine-grained access control this project does not want. `MANAGE_PERMISSIONS` is seeded but not used.
- **Download links are public, short-lived tokens.** `GET /document/:id/download` requires a login and returns a link containing a signed JWT (expiry set by `DOWNLOAD_LINK_EXPIRY`, 10 minutes by default). The download route itself needs no login; the token is the credential.
- **A missing document or role in a permission check answers 403**, and only a real database failure answers 500.
- **Empty lists are normal.** An empty list or search answers 200 with `total: 0`.

## Known limitations

- No tests yet.
- No file size or type limits on uploads.
- Search is basic: `title` and `tag` are partial, case-insensitive matches, `authorId` is exact, and the filters are combined with OR. There are no sorting options.
- The `:id` and `:token` route parameters are not validated with Zod yet.
- Entity ids are created by the database (`defaultRandom()`), not by the application.
- Stored files live in `public/uploads` on the local disk.

## What I would build next

- Application-generated UUIDs with entity factories (`crypto.randomUUID()`).
- Automated tests.
- A second document store behind the existing repository interface.
