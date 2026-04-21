# Theme Foundation Implementation Plan

Date: 2026-04-21
Scope: add switchable dark/light themes to the public site using tokenized CSS variables

## Goal

Introduce a real theme foundation without changing project-specific styling yet.

After this phase:

- the public site can switch between `dark` and `light`;
- the choice is persistent;
- all major public surfaces read from shared theme variables;
- future project presets can be added on top without restructuring blocks again.

## Files To Modify

- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/components/Header.tsx`
- `src/components/Header.module.scss`
- `src/store/useAppStore.ts` or a new dedicated theme store
- `src/styles/styles.scss`
- `src/styles/_base.scss`
- `src/styles/_layout.scss`
- `src/styles/_blocks.scss`
- `src/styles/_pages.scss`

## Optional New Files

- `src/lib/themeTokens.ts`
- `src/components/ThemeToggle.tsx`
- `src/components/ThemeToggle.module.scss`

## Architecture

### 1. Theme Mode Source

Create a lightweight frontend state:

```ts
type ThemeMode = 'dark' | 'light';
```

Persist it in `localStorage` under a stable key:

```ts
alexandradiz-theme-mode
```

### 2. Root Theme Binding

Bind the selected theme to the outer app shell:

```tsx
<div data-theme={themeMode}>
  {children}
</div>
```

### 3. Token Sets

Define two token maps:

- `dark`
- `light`

Minimum tokens:

- `--theme-bg`
- `--theme-surface`
- `--theme-surface-strong`
- `--theme-text-primary`
- `--theme-text-secondary`
- `--theme-accent`
- `--theme-accent-soft`
- `--theme-border`
- `--theme-header-bg`
- `--theme-footer-bg`

### 4. Block Consumption

Refactor public blocks so they read from theme variables instead of raw dark colors where practical.

Start with:

- page background;
- header;
- footer;
- CTA blocks;
- editorial cards;
- project content surfaces;
- buttons and borders.

Do not attempt to make every legacy selector perfect in one pass.
Cover the main public surfaces first.

## Implementation Steps

### Step 1. Create token definitions

Move runtime theme variables into a structured token layer.

Target outcome:

- `:root` contains defaults;
- `[data-theme='dark']` contains dark token values;
- `[data-theme='light']` contains light token values.

### Step 2. Add theme state and persistence

Implement:

- initial theme load from `localStorage`;
- fallback to `dark` for now;
- `setThemeMode(mode)` action;
- writeback on change.

### Step 3. Add public toggle

Place the toggle in the header.

Requirements:

- visible on desktop and mobile;
- clear active state;
- does not break existing navigation layout;
- one-click switch only.

### Step 4. Retheme global surfaces

Replace hardcoded site-wide dark colors in:

- `body`
- `header`
- `footer`
- public page wrappers

with CSS variables.

### Step 5. Retheme high-visibility blocks

Migrate the most visible blocks first:

- `beforeAfter`
- `ctaSection`
- `editorialNote`
- `sideBySide`
- `refinedSlider`

Only replace colors and borders.
Do not redesign layouts in this phase.

### Step 6. Regression pass

Verify:

- dark mode remains visually consistent with current baseline;
- light mode is readable and not low-contrast;
- mobile header still works;
- project pages do not become unreadable.

## Acceptance Criteria

- theme switch exists in the public UI;
- selected theme survives reload;
- dark mode remains the current baseline quality;
- light mode is usable across homepage, category page, project page, contact page, and about page;
- no block depends on hardcoded `#141414` / white-only assumptions for its main surfaces.

## Risks

- the current SCSS contains many hardcoded dark values;
- header spacing can break if the toggle is inserted carelessly;
- some blocks may need token fallbacks before presets exist.

## Explicit Non-Goals

- no per-project presets yet;
- no admin UI yet;
- no theme import/export;
- no automatic OS theme detection unless later requested.
