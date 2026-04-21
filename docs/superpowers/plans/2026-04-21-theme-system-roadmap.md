# Theme System Roadmap

Date: 2026-04-21
Scope: public theme switching, project-level style presets, and admin-managed theme tokens

## Goal

Build a theme system that supports:

- global site theme switching (`dark` / `light`);
- future project-specific visual presets such as `kids`, `minimal`, `luxury`, `warm`;
- admin-side management of theme colors without rewriting frontend blocks.

## Why This Needs Multiple Layers

One flat `dark/light` toggle is not enough.

The site now needs three layers:

1. `site theme`
   - global dark/light mode;
   - affects base background, text, surface, header, borders, buttons.

2. `project style preset`
   - visual personality of a specific project page;
   - affects accents, section surfaces, decorative treatment, and some typography rhythm.

3. `block rendering rules`
   - blocks continue using CSS variables;
   - they should not hardcode project-specific colors.

This keeps the system flexible and prevents future rewrites when a category like a kids room needs a softer palette and different accents.

## Recommended Rollout Order

### Phase 1. Theme Foundation

Implement the global token system and public toggle first.

Result:

- dark/light theme works across the site;
- theme is stored in `localStorage`;
- frontend reads colors from shared CSS variables;
- no admin UI yet.

Implementation doc:

- `docs/superpowers/plans/2026-04-21-theme-foundation-implementation.md`

### Phase 2. Project Style Presets

Add a project-level `stylePreset` field and a preset resolver.

Result:

- each project can opt into `default`, `kids`, `minimal`, etc.;
- preset tokens layer on top of the active site theme;
- blocks automatically inherit the correct palette.

Implementation doc:

- `docs/superpowers/plans/2026-04-21-project-style-presets-implementation.md`

### Phase 3. Admin Theme Editor

Add a dedicated admin section for theme management.

Result:

- owner can edit base dark/light tokens from admin;
- later, preset colors can also be edited there;
- frontend consumes persisted token sets.

Implementation doc:

- `docs/superpowers/plans/2026-04-21-admin-theme-editor-implementation.md`

## Data Model Direction

### Site-Level Theme Data

Recommended shape:

```ts
type ThemeMode = 'dark' | 'light';

type ThemeTokens = {
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentSoft: string;
  border: string;
  headerBackground: string;
  footerBackground: string;
};

type ThemeConfig = {
  dark: ThemeTokens;
  light: ThemeTokens;
};
```

### Project-Level Preset Data

Recommended minimum field on project:

```ts
stylePreset?: 'default' | 'kids' | 'minimal' | 'luxury' | 'warm' | 'editorial';
```

Do not store raw block-level colors on the project yet.
First stabilize preset-based rendering.

## CSS Strategy

Use CSS variables as the only rendering surface.

Example:

```css
:root {
  --theme-bg: #141414;
  --theme-surface: #1d1d1d;
  --theme-text-primary: #ffffff;
  --theme-text-secondary: rgba(255, 255, 255, 0.72);
  --theme-accent: #c6a47b;
}
```

Project preset layer:

```css
[data-project-preset='kids'] {
  --project-accent: #d989b5;
  --project-surface: #fff5fb;
  --project-surface-strong: #ffe8f5;
}
```

Blocks should then consume:

```css
color: var(--project-text-primary, var(--theme-text-primary));
background: var(--project-surface, var(--theme-surface));
```

## Main Guardrails

- no hardcoded light-theme colors inside individual blocks;
- no per-project ad hoc CSS files for every project;
- no admin color editor before token architecture exists;
- presets should override tokens, not component structure;
- public theme toggle and project preset must be able to coexist.

## Deliverables

By the end of the full roadmap, the codebase should have:

- a global theme mode switcher;
- token-driven dark/light rendering;
- project `stylePreset` support;
- admin-managed theme palette editing;
- a clean inheritance chain: `theme -> preset -> block`.
