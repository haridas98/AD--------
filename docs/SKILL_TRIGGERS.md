# Skill Triggers

Use this matrix to pick the minimal required skill set.

## Task -> Skill
- React pages/components/routes/state -> `frontend-react-ui`
- Express endpoints/auth/uploads -> `backend-node-api`
- Prisma schema/migrations/DB compatibility -> `postgres-schema`
- SCSS/CSS Modules/PurgeCSS issues -> `styling-css-modules`
- Browser flow verification/regression -> `testing-playwright`
- Defect triage and minimal fix -> `bugfix-workflow`
- Behavior-preserving cleanup/refactor -> `refactor-guardrails`
- Docker/nginx/runtime/deploy diagnosis -> `deploy-debug`

## Combo Rules
- UI bug in production styles -> `bugfix-workflow` + `styling-css-modules` + `testing-playwright`
- API + DB change -> `backend-node-api` + `postgres-schema`
- Deploy-only failure -> `deploy-debug` (+ `backend-node-api` if API behavior involved)

