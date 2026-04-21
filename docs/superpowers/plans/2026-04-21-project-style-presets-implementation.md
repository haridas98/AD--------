# Project Style Presets Implementation Plan

Date: 2026-04-21
Scope: support project-level visual presets such as `kids`, `minimal`, and `luxury`

## Goal

Add project-specific visual styling without fragmenting the frontend into one-off CSS for every project.

After this phase:

- each project can declare a `stylePreset`;
- the preset injects project-scoped variables;
- blocks inherit those variables automatically;
- the same project can still respect the global dark/light theme.

## Core Principle

Use preset-driven tokens, not per-project CSS files.

Bad direction:

- separate stylesheet for each project;
- custom CSS blobs stored in admin;
- direct block color fields on every project.

Good direction:

- stable preset names;
- preset token maps;
- project wrapper binds preset name to DOM;
- blocks consume token variables only.

## Files To Modify

- `src/pages/ProjectPage.tsx`
- `src/pages/AdminPage.tsx`
- `src/lib/projectBlockTemplates.ts`
- `src/types.ts` or relevant type files
- `server/index.js`
- content persistence helpers if project schema is normalized there
- `src/styles/_blocks.scss`
- `src/styles/_pages.scss`

## Optional New Files

- `src/lib/projectStylePresets.ts`
- `src/styles/_project-presets.scss`

## Data Model

Add to project model:

```ts
stylePreset?: 'default' | 'kids' | 'minimal' | 'luxury' | 'warm' | 'editorial';
```

Default:

```ts
'default'
```

## DOM Strategy

Project page root should expose preset:

```tsx
<main data-project-preset={project.stylePreset || 'default'}>
```

This must live high enough in the DOM so every project block inherits it.

## Preset Token Strategy

Each preset should define only variables, for example:

```css
[data-project-preset='kids'] {
  --project-accent: #de7cb1;
  --project-accent-soft: #f7d7ea;
  --project-surface: #fff8fc;
  --project-surface-strong: #ffeef7;
  --project-text-primary: #2e2330;
  --project-text-secondary: rgba(46, 35, 48, 0.72);
  --project-border: rgba(222, 124, 177, 0.22);
}
```

Another preset can stay darker and calmer:

```css
[data-project-preset='minimal'] {
  --project-accent: #8f887d;
  --project-surface: #f4f1ed;
  --project-surface-strong: #ebe6de;
}
```

## Block Consumption Pattern

Every block should use fallback logic like:

```css
color: var(--project-text-primary, var(--theme-text-primary));
background: var(--project-surface, var(--theme-surface));
border-color: var(--project-border, var(--theme-border));
```

This keeps presets optional.

## Implementation Steps

### Step 1. Add preset field to project data flow

Update:

- frontend project type;
- admin project form state;
- API read/write handling.

### Step 2. Add preset selector in admin

In project editor:

- add a `Style preset` select;
- available values: `default`, `kids`, `minimal`, `luxury`, `warm`, `editorial`.

No custom color editor yet.

### Step 3. Bind preset to project page root

Expose:

```tsx
data-project-preset={project.stylePreset || 'default'}
```

### Step 4. Add preset token maps

Create a shared preset definition file or SCSS partial.

Keep first version small:

- `default`
- `kids`
- `minimal`

The other preset names can exist as aliases or TODO-ready placeholders if needed, but avoid fake unused styling noise.

### Step 5. Update key project blocks to consume preset tokens

Priority blocks:

- `hero`
- `editorialNote`
- `ctaSection`
- `beforeAfter`
- `circleDetail`
- `mosaicPreset`

### Step 6. Verify theme stacking

Check:

- dark + default
- light + default
- dark + kids
- light + kids

If some preset colors only work on one theme, split preset variables into semantic ones rather than hardcoded final colors.

## Acceptance Criteria

- admin can choose a preset per project;
- project page root exposes preset in DOM;
- preset changes visible styling without breaking layout;
- global site theme still works with project preset active;
- no block requires preset-specific custom markup.

## Risks

- mixing raw colors and semantic tokens will create inconsistent rendering;
- too many preset-specific exceptions inside blocks will become unmaintainable;
- presets can accidentally reduce contrast in light theme if colors are not semantic enough.

## Explicit Non-Goals

- no freeform per-project color picker yet;
- no per-block custom color overrides yet;
- no category-wide auto-preset logic yet.
