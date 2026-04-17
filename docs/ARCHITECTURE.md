# Architecture

## Overview
- Monorepo with one React SPA (`src/`) and one Node.js API (`server/index.js`).
- API serves both JSON endpoints (`/api/*`) and production static frontend from `public/`.
- Prisma is used for data access (`@prisma/client`), schema is in `server/prisma/schema.prisma`.
- Current runtime DB in repo/Docker is SQLite; target runtime is PostgreSQL.

## Main Parts
- Frontend:
  - Entry: `src/main.tsx`
  - App router + page composition: `src/App.tsx`
  - Global state: `src/store/useAppStore.ts` (Zustand)
  - HTTP client: `src/lib/api.ts`
- Backend:
  - Express app + routes + auth + uploads: `server/index.js`
  - Image upload processing: `multer` + `sharp`
  - Auth session store: in-memory `Map` (process-local)
- Data layer:
  - Prisma client in backend process
  - Models: `Category`, `Project`, `BlogPost`, `Location`
  - Migrations and seed: `server/prisma/migrations`, `server/prisma/seed.ts`

## Request/Data Flow
1. Browser loads SPA (`src/main.tsx` -> `App.tsx`).
2. Frontend calls `src/lib/api.ts` (`/api/content`, `/api/blog`, admin endpoints).
3. Express route handlers call Prisma queries/mutations.
4. Prisma reads/writes DB via `DATABASE_URL`.
5. JSON returns to frontend; Zustand state updates and pages re-render.

## Runtime Modes
- Dev:
  - `npm run dev` starts Vite + Node API separately.
  - API base defaults to `http://localhost:8787` in dev.
- Production/Docker:
  - Vite build output copied to `public/` inside container.
  - Express serves static files and SPA fallback after `/api/*`.
  - Nginx proxies to app container (`docker-compose.yml`, `nginx.conf`).

## Legacy Source Material
- Original site structure/assets are kept in:
  - `public/legacy`
  - `dist/legacy`
- These folders are migration reference and must stay intact unless explicitly migrated/replaced.

