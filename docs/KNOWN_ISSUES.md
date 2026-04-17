# Known Issues

## Architecture/Code
- Backend is a monolith in `server/index.js`; no controller/service split yet.
- Session storage is in-memory (`Map`), so auth sessions are lost on restart/redeploy.
- Frontend expects some fields in `/api/content` (`site`, `sections`, `pages`) that are not provided by backend; currently masked by frontend defaults.

## Database
- Prisma provider is still `sqlite`; PostgreSQL is target but not active.
- Time fields (`createdAt`, `updatedAt`, `publishedAt`) are stored as `String`, not temporal DB types.
- `Project.locationId` exists but Prisma relation to `Location` is not declared.
- Two SQLite files exist (`server/dev.db` and `server/prisma/dev.db`) which can confuse local workflows.

## Frontend/Styles
- Styling is primarily global SCSS; CSS Modules are not systematically adopted yet.
- Production CSS uses PurgeCSS and can drop dynamic selectors if safelist is incomplete.
- `src/App.tsx` uses global `location.pathname` instead of `useLocation()` in component scope, which is fragile for future SSR/refactors.

## Build/Runtime
- `package.json` docker scripts reference `--profile dev/prod`, but current `docker-compose.yml` has no profiles.
- `.env` with `NODE_ENV=production` triggers Vite warning during frontend build.
- `DOCKER.md` and runtime setup may diverge from current compose/file reality; treat docs as potentially stale.

## Migration Context
- `public/legacy` and `dist/legacy` are reference sources from original site and must remain available during migration.

