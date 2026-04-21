# Alexandra Diz React + Admin

## Run

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:8787
- Admin: http://localhost:5173/admin

## Deploy (current stack)

```bash
npm run deploy:check
npm run deploy:up
```

Health checks:

- App: `http://localhost:8787/api/health`
- Nginx proxy: `http://localhost/api/health`

Stop:

```bash
npm run deploy:down
```

## Admin authorization

Default credentials:

- username: `admin`
- password: `admin123`

You can change them via environment variables before running server:

- `ADMIN_USER`
- `ADMIN_PASSWORD`

## What is included

- Full SPA navigation with React Router (no full page reload).
- Responsive public site with improved contrast, buttons, and smooth reveal animations.
- Node.js + Express backend with Prisma + SQLite (persisted in Docker via volume).
- Admin UI for:
  - signing in/out,
  - adding/editing/deleting projects,
  - editing project descriptions and "what was done",
  - choosing which projects appear on the home page sections,
  - uploading cover/gallery images.

## Image uploads

- Uploaded images are converted to JPG on the backend.
- Files are saved locally in `public/uploads`.
- API returns URLs like `http://localhost:8787/uploads/<file>.jpg`.

## Data

Prisma schema and dev SQLite file live in `server/prisma/`.

For frontend API base URL in non-docker dev, set `VITE_API_BASE_URL` (optional). In production it defaults to same-origin (`/api/...`).
