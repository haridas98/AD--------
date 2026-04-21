# Admin Theme Editor Implementation Plan

Date: 2026-04-21
Scope: add an admin section for managing dark/light theme tokens and later preset palettes

## Goal

Give the owner a dedicated place in admin to manage theme colors without touching code.

After this phase:

- admin includes a `Themes` section;
- dark and light base themes are editable;
- values are persisted through the backend;
- frontend uses persisted tokens instead of hardcoded defaults.

## Relationship To Earlier Phases

This phase must come after theme foundation is in place.

Why:

- without token architecture, a theme editor has nowhere clean to write;
- without a public theme switch, editor changes are hard to verify;
- without stable token names, admin UI becomes throwaway work.

## UI Structure

Add a new admin tab:

```txt
Themes
```

Inside it:

### Section 1. Theme Mode Groups

- `Dark Theme`
- `Light Theme`

Each group contains editable fields for base tokens.

### Section 2. Preview Swatches

For each theme:

- background preview
- surface preview
- text preview
- accent preview

This is enough for first pass.
Do not build full live page preview in this phase.

### Section 3. Future Preset Area

Reserve structure for:

- `Project Presets`

But only enable it after base themes are stable.

## Tokens To Expose First

Recommended base token list:

- `background`
- `surface`
- `surfaceElevated`
- `textPrimary`
- `textSecondary`
- `accent`
- `accentSoft`
- `border`
- `headerBackground`
- `footerBackground`

Do not expose dozens of micro tokens in v1.

## Backend Shape

Recommended payload:

```ts
type ThemeSettings = {
  dark: ThemeTokens;
  light: ThemeTokens;
};
```

This can be stored:

- as a JSON file if the project is still file-backed for content;
- or as a DB JSON field if theme settings move into Prisma later.

Use the same persistence strategy already used for editable site content.

## Files To Modify

- `src/pages/AdminPage.tsx`
- `src/lib/api.ts`
- `server/index.js`
- storage helper used by content persistence
- `src/store/useAppStore.ts`
- `src/App.tsx`

## Optional New Files

- `src/components/admin/AdminThemeEditor.tsx`
- `src/components/admin/AdminThemeEditor.module.scss`
- `src/lib/themeTokens.ts`

## Implementation Steps

### Step 1. Add backend read/write support

Expose theme settings through admin content API.

Requirements:

- included in admin fetch response;
- save endpoint validates token keys;
- empty values fall back safely.

### Step 2. Add a `Themes` tab in admin

New tab should not be mixed into project editing UI.
It should be its own section beside:

- projects
- categories
- blog
- before/after

### Step 3. Build token editor fields

Use simple color inputs plus text fields for exact values if needed.

Recommended input pattern:

- label
- color swatch input
- text input with hex/RGB value

### Step 4. Save and reload flow

After save:

- theme settings persist;
- frontend store updates;
- public pages can use fresh values without manual code edits.

### Step 5. Add simple admin preview row

Show mini cards using the edited values:

- page background
- section surface
- accent button
- text sample

This reduces accidental unreadable palettes.

### Step 6. Prepare slot for future preset editing

Do not fully implement preset editor yet, but structure the tab so it can later contain:

- preset list
- preset token editor
- preset preview

## Acceptance Criteria

- admin has a dedicated `Themes` tab;
- dark and light themes can be edited and saved;
- token changes affect the public site;
- defaults still work when no custom values are saved;
- structure is ready for later preset editing.

## Risks

- too many exposed fields will overwhelm the owner;
- weak validation can allow invalid CSS values;
- changing theme data shape later will be painful if the API contract is vague now.

## Explicit Non-Goals

- no drag-and-drop visual theme builder;
- no AI-generated palettes yet;
- no project preset editor yet;
- no block-level per-project overrides yet.
