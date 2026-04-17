# AGENTS.md

## Scope
- Migration project: `alexandradiz.com` -> React + Node.js + Prisma, PostgreSQL target.
- Keep legacy references intact: `public/legacy`, `dist/legacy`.

## Read Order
- 1) This file (execution guardrails).
- 2) `docs/ARCHITECTURE.md`, `docs/DB_SCHEMA.md`, `docs/KNOWN_ISSUES.md`, `docs/SKILL_TRIGGERS.md`.
- 3) Relevant skill from `.codex/skills/*`.

## Fast Map
- Frontend: `src/`
- Backend API: `server/index.js`
- Prisma schema/migrations: `server/prisma/`
- Infra: `Dockerfile`, `docker-compose.yml`, `nginx.conf`

## Commands
- `npm run dev`
- `npm run build`
- `npm run test:smoke`
- `npm run start:server`
- `docker compose up -d --build`
- `npx prisma generate --schema=server/prisma/schema.prisma`
- `npx prisma migrate dev --schema=server/prisma/schema.prisma`
- `npx prisma migrate deploy --schema=server/prisma/schema.prisma`
- `npx tsx server/prisma/seed.ts`
- Smoke checks: `npm run test:smoke`.

## Core Guardrails
- Keep changes minimal and scoped to task.
- Keep public/admin API contract stable unless explicitly requested.
- Do not add dependencies without clear need.
- Do not touch unrelated files during fix/refactor.
- Do not commit secrets.

## WORKFLOW
- Bugfix: reproduce -> root cause -> minimal fix -> verify -> short change note.
- Feature: clarify acceptance -> minimal implementation -> verify end-to-end -> avoid overengineering.
- Refactor: no API behavior change -> small incremental edits -> no unrelated files.
- Testing:
  - UI changes: validate affected user scenarios in dev/build behavior.
  - Backend changes: run `npm run test:smoke` and validate error paths/status codes.

## External tools
- GitHub MCP: PR/issue/review/check context.
- PostgreSQL MCP: schema/read-query validation when code context is not enough.
- Playwright MCP: browser-level flow/regression validation.

## MCP Safety
- No destructive SQL without explicit confirmation.
- No mass edits/updates/actions without explicit request.
- Use MCP only when it materially helps current task.

## Definition of Done
- Works in local dev and production build.
- No regressions in routes, API endpoints, core admin flows.
- DB changes include Prisma schema + migration + generate steps.
- Backend-impacting changes pass `npm run test:smoke`.
