# Portfolio Layout Design

Date: 2026-04-18
Scope: frontend-only visual standardization for portfolio pages and project presentation

## Goal

Standardize the public-facing portfolio UI so that:

- containers and side gutters are consistent across pages;
- HomePage highlights selected featured projects with a stronger editorial presentation;
- CategoryPage uses a stable, repeatable catalog layout;
- ProjectPage keeps its custom block-based composition but is visually aligned with the rest of the site;
- image behavior is predictable on desktop, tablet, and mobile, including mixed horizontal and vertical assets.

## In Scope

- global container and spacing system;
- Header/Footer separation into dedicated style modules;
- HomePage featured category presentation;
- CategoryPage card layout standardization;
- ProjectPage frontend polish and responsive normalization;
- new frontend project blocks:
  - refined slider;
  - circle detail block;
  - editorial note/material block;
  - mosaic preset block.

## Out of Scope

- admin-side crop selection UI;
- advanced admin-side freeform mosaic builder;
- deep content model redesign beyond what is necessary for frontend rendering.

## Container System

Use a three-level layout model:

### 1. Page Shell

Outer wrapper for all public pages.

- width: 100%;
- horizontal padding: `clamp(12px, 2vw, 40px)`;
- keeps content close to screen edges on mobile;
- preserves safe gutters on larger screens.

### 2. Portfolio Wide Container

Used for portfolio-heavy layouts:

- HomePage featured category sections;
- CategoryPage;
- large image blocks;
- ProjectPage image-led content zones.

Rules:

- max-width: approximately `2200px`;
- intended for large desktop and ultra-wide displays;
- should avoid narrow centered strips on FHD and 3440px screens;
- should still preserve stable gutters and avoid endless full-width stretching.

### 3. Text Content Container

Used only for text-led content:

- blog post text;
- long descriptions;
- forms;
- static text pages where readability matters more than image scale.

Rules:

- max-width: approximately `1280px`;
- must not be used for category grids or main portfolio image layouts.

## Spacing Rules

- desktop horizontal gutters: up to 40px;
- tablet horizontal gutters: around 24px;
- mobile horizontal gutters: around 16px;
- no content or image cards should visually stick to screen edges on small devices;
- fixed-header compensation should be standardized instead of using scattered page-specific top padding rules.

## HomePage

HomePage should use a two-level category presentation.

### Featured Lead Presentation

For selected projects on the homepage:

- use an editorial lead layout based on the chosen "B" direction;
- one project acts as the lead project for its category;
- this lead block appears first within the category section;
- it should feel more premium and more curated than the default cards.

### Supporting Grid

Under the lead block:

- render the remaining strong projects from the same category in a more stable grid;
- the supporting grid should retain large images and clear spacing;
- layout should remain calmer than the lead block.

### HomePage Selection Logic

- existing featured/public selection from admin remains the basis;
- frontend can interpret a selected project as the category lead on the homepage;
- if no lead project exists, the category falls back to the standard grid presentation.

## CategoryPage

CategoryPage uses the stable "A" catalog approach.

Rules:

- one intro/title block at top;
- below it, a repeatable two-column layout on desktop;
- cards are large and image-led;
- target visual height: roughly `clamp(420px, 58vh, 860px)`;
- image mode for category cards: `cover`;
- title/metadata sit over a bottom gradient overlay;
- tablet should preserve two columns when space allows;
- mobile collapses to one column while keeping side gutters.

Category pages should feel controlled, clean, and consistent rather than editorially irregular.

## ProjectPage

ProjectPage is a separate system because its composition is created through block content in admin.

### General Rule

ProjectPage should be aligned to project-wide standards for:

- container logic;
- gutters;
- image behavior;
- responsive behavior;
- visual polish.

But it should not be forced into the same composition model as HomePage or CategoryPage.

### Existing Custom Block Nature

The page remains block-driven and customizable through admin-managed blocks such as:

- `heroImage`;
- `imageGrid`;
- `sideBySide`;
- `typography`;
- `beforeAfter`;
- `ctaSection`.

### ProjectPage Standardization Boundary

In this session:

- keep the composition flexible;
- improve block presentation quality;
- normalize spacing and responsiveness;
- add new frontend-ready block types where useful.

## Image Behavior

### General Principle

Use a hybrid strategy instead of one universal mode.

- list/grid previews: `cover`;
- large single project images: soft `cover` by default;
- when a frame would be damaged by aggressive cropping, switch to a contained presentation inside a stable visual frame.

### Mixed Aspect Ratios

The system must handle both:

- horizontal images (`16:9`, landscape);
- vertical images (`9:16`, portrait).

Without causing layout jumps.

Rules:

- image stage dimensions should remain stable;
- switching between horizontal and vertical images must not cause surrounding UI to shift abruptly;
- when portrait assets are shown in a wide stage, use contained presentation inside a stable wrapper;
- allow soft background treatment or derived background fills so empty space looks intentional;
- thumbnails, captions, and controls should stay fixed in place.

## New Project Blocks

### 1. Refined Slider Block

Purpose:

- show one large project image at a time with secondary thumbnails.

Behavior:

- no large visible left/right arrow buttons;
- swipe support on mobile/touch;
- invisible click/tap zones near the left and right edges of the main image;
- autoplay interval: 15 seconds;
- thumbnails switch the large image.

Thumbnail placement options:

- left of the large image;
- right of the large image;
- below the large image.

Important:

- the slider stage must not change height when switching between portrait and landscape assets;
- supporting UI must not jump.

### 2. Circle Detail Block

Purpose:

- highlight details, materials, top moments, or design accents.

Examples:

- "5 top moments in this project";
- "notice the details";
- material highlights;
- craftsmanship accents.

Responsive rules:

- desktop: 4-5 circles in one row when possible;
- tablet: around 3 per row;
- mobile: 2 per row or a controlled horizontal scroll pattern.

### 3. Editorial Note / Material Block

Purpose:

- introduce a more premium editorial rhythm without heavy admin complexity.

Possible use:

- short designer note;
- material callout;
- quote-like highlight;
- image + caption strip.

### 4. Mosaic Preset Block

Purpose:

- provide visually richer image grouping without building a heavy admin-side layout editor.

Rules:

- do not start with a freeform cell-by-cell editor;
- offer curated mosaic presets;
- presets should support connected image spans such as wide double cells;
- keep implementation bounded and predictable.

## Responsive Rules

### Mobile

- maintain visible side gutters;
- avoid edge-to-edge cards unless intentionally full-bleed;
- ensure lead sections and image blocks remain readable and touch-friendly;
- prevent thumbnail overflow and broken slider alignment.

### Tablet

- preserve two-column category layouts when viable;
- support alternate thumbnail positions for sliders with graceful stacking when needed.

### Desktop / Ultra-Wide

- use the wide portfolio container;
- avoid narrow content strips;
- avoid uncontrolled ultra-wide stretching;
- preserve strong image scale and premium composition.

## Styling Architecture

Migration direction:

- keep only core tokens, reset, container primitives, and utilities in the global style layer;
- move Header and Footer into dedicated CSS Modules;
- move page-specific public layouts toward dedicated modules;
- isolate portfolio media styling into a clearer frontend layer;
- remove old global rules only after each migrated zone is covered.

## Implementation Priority

1. global container and spacing system
2. HomePage featured + supporting category presentation
3. CategoryPage standardization
4. ProjectPage frontend polish
5. refined slider block
6. circle detail block
7. editorial note/material block
8. mosaic preset block
9. final responsive pass across public pages

## Deferred Notes

Deferred for another session/context:

- admin crop-area selector for circle detail images;
- advanced admin mosaic builder with freeform cell construction;
- any heavy admin-side tooling for manual image framing.
