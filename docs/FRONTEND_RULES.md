# Frontend Rules

## Stack/Boundaries
- React + React Router + Zustand + SCSS (`src/`).
- Network calls only through `src/lib/api.ts`.
- App-wide state only through `src/store/useAppStore.ts` unless local UI state is enough.

## Component Rules
- Keep presentational components free of fetch logic.
- Page components orchestrate data loading and pass props down.
- Reuse existing block pattern in `src/components/blocks/*` for project content blocks.
- Keep route compatibility defined in `src/App.tsx` (legacy URL paths must continue to work).

## Hooks Rules
- Use function components and React hooks only.
- Keep side effects in `useEffect`; prevent duplicate fetches and loading-state races.
- Do not store server payload in multiple parallel places when Zustand already owns it.
- For admin auth, keep token flow via `api.login/logout/me` and `localStorage` key `ad_admin_token`.

## API Integration Rules
- New frontend endpoints must be added in `src/lib/api.ts`, not called ad-hoc from components.
- Preserve same-origin support for production and `VITE_API_BASE_URL` override behavior.
- Handle non-OK responses through existing `request()` error path.

## Styling Rules (SCSS + CSS Modules)
- Current codebase uses global SCSS imports via `src/styles/styles.scss`.
- New/isolated UI pieces should prefer `*.module.scss` to reduce global leakage.
- Shared tokens/layout/theme stay in shared SCSS files under `src/styles/`.
- If using dynamic class names, verify production CSS keeps required selectors (PurgeCSS safelist).

## Delivery Checklist (Frontend)
- Works in both `npm run dev` and `npm run build` output.
- Route-level behavior unchanged unless task explicitly changes UX.
- No direct `fetch()` calls outside `src/lib/api.ts`.

