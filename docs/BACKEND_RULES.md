# Backend Rules

## Current Backend Shape
- Single Express entrypoint: `server/index.js`.
- Prisma client is created once per process.
- Routes currently contain transport + business + data logic in one place.

## API Structure
- Public:
  - `GET /api/content`
  - `GET /api/projects/:slug`
  - `GET /api/categories/:slug`
  - `GET /api/blog`
  - `GET /api/blog/:slug`
  - `GET /api/health`
- Auth:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Admin (requires bearer token):
  - `GET /api/admin/content`
  - `GET /api/admin/stats`
  - CRUD: `/api/admin/categories`
  - CRUD: `/api/admin/projects`
  - CRUD: `/api/admin/blog`
  - `POST /api/admin/upload-image`

## Controller/Service Direction
- Target structure for new code:
  - `server/controllers/*` for HTTP request/response mapping.
  - `server/services/*` for business rules.
  - `server/repositories/*` (optional) for Prisma query composition.
- For existing routes, refactor incrementally; avoid big-bang rewrite.
- Keep request/response contracts stable while moving logic into services.

## Error Handling Rules
- Validate required request fields before Prisma calls.
- Return explicit status codes:
  - `400` invalid input
  - `401` unauthorized/session expired
  - `404` not found
  - `409` unique conflict
  - `500` unexpected error
- Keep machine-readable JSON error body: `{ "error": "<message>" }`.
- Log internal errors server-side (`console.error` currently used); do not leak stack traces to clients.

## Auth/Session Rules
- Bearer token required for all `/api/admin/*`.
- Session store is in-memory and process-local; treat it as non-durable.
- Any multi-instance deployment should plan external session or JWT strategy.

## Upload Rules
- Upload endpoint accepts image MIME types `jpeg/jpg/png/webp`.
- Keep output under `public/uploads`.
- Preserve deterministic file naming behavior used by admin UI.

