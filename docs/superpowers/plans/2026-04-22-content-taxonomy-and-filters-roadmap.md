# Content Taxonomy And Filters Roadmap

Date: 2026-04-22
Scope: admin project organization, category/subcategory structure, public category navigation, and future visual filters

## Current Context

The project already has these major foundations in place:

- unified public theme system with `dark` and `light`;
- admin theme editor;
- project page block system;
- admin-side block editing for project pages;
- base project page structures and reusable visual blocks;
- public project cards and category pages already migrated away from legacy layout.

This means the next bottleneck is no longer styling foundation.
The next bottleneck is content structure.

Right now:

- admin shows projects as one flat list;
- categories exist, but there is no real nested taxonomy;
- category pages do not support subcategory navigation;
- the site cannot filter projects by palette or style;
- the future search experience is blocked by missing metadata.

## Goal

Build a content model that supports:

1. better admin project organization;
2. parent category -> subcategory hierarchy;
3. public category pages with subcategory navigation;
4. future filters by color palette and interior style;
5. future AI-assisted project page generation based on structured metadata.

## Why This Should Be The Next Step

Without a proper taxonomy layer:

- the admin becomes harder to use as the number of projects grows;
- category pages stay shallow and repetitive;
- future filters become hacky;
- AI generation will have too little structured input.

The user problem is already visible in admin:

- the project list is visually noisy;
- projects from different categories are mixed together;
- the editor does not reflect how the public catalog should actually work.

## Target Content Model

Recommended direction:

### Layer 1. Main Category

Examples:

- `Kitchens`
- `Bathrooms`
- `Full House Remodeling`
- `ADU`
- `Fireplaces`

### Layer 2. Subcategory

Examples for `Bathrooms`:

- `Modern`
- `Minimal`
- `Classic`
- `Kids`
- `Luxury`

These must be editable from admin.

### Layer 3. Filter Metadata

Each project should later support structured metadata such as:

- `styleTags`
  - `minimal`
  - `classic`
  - `gothic`
  - `transitional`
  - `modern`
- `paletteTags`
  - `pastel`
  - `dark`
  - `bright`
  - `neutral`
  - `warm`
  - `cool`
- optional future tags:
  - `materialTags`
  - `spaceMoodTags`
  - `featureTags`

Do not implement free-form chaos first.
Use controlled option lists.

## Recommended Rollout

### Phase 1. Admin Project List Restructure

Goal:

- stop showing projects as one long flat list.

What to build:

- group projects in admin by main category;
- allow collapsing category groups;
- inside each category, sort projects cleanly;
- show project count per category;
- reserve visual space for future subcategory grouping.

Result:

- admin becomes readable immediately;
- no DB redesign is required for first pass;
- this can ship before deeper taxonomy work.

## Phase 2. Subcategory Data Model

Goal:

- support real subcategories in data, not only visual grouping.

Recommended approach:

- add a `subcategory` entity or a self-nested category structure;
- each project references:
  - `categoryId`
  - `subcategoryId` (optional at first, required later for categories that use it)

Recommendation:

- use a separate `subcategory` model linked to `category`.

Why:

- simpler admin UI;
- simpler filtering;
- avoids overloading the main category table;
- easier to migrate legacy bathroom subdivisions.

## Phase 3. Admin UI For Categories And Subcategories

Goal:

- make subcategories editable without turning the admin into a spreadsheet.

What to build:

- inside `Categories`, add subcategory management under each main category;
- allow create / rename / reorder / delete;
- show whether a subcategory is used by projects;
- when editing a project, show:
  - main category selector;
  - dependent subcategory selector.

Result:

- admin starts reflecting the actual catalog hierarchy.

## Phase 4. Public Category Pages With Subcategory Navigation

Goal:

- category pages such as `Bathrooms` should expose internal structure.

What to build:

- top area with subcategory navigation chips or tabs;
- page can show:
  - all projects;
  - or only a selected subcategory;
- support direct links to a subcategory view.

For example:

- `/bathrooms`
- `/bathrooms?sub=modern`

Later, if needed:

- `/bathrooms/modern`

Recommendation for first pass:

- query-param or client-side state first;
- nested route later only if SEO or IA requires it.

## Phase 5. Style And Palette Filters

Goal:

- support queries like:
  - pastel minimal kitchens;
  - bright colorful kitchens;
  - dark gothic interiors.

What to build:

- controlled metadata fields in admin;
- public filter UI on category pages;
- combined filtering by:
  - subcategory;
  - palette;
  - style.

Important:

- do not start from open text inputs;
- start from curated filter vocabularies;
- later allow the owner to edit available options if needed.

## Phase 6. AI-Assisted Project Structuring

Goal:

- prepare the system for future AI help.

Future workflow:

- owner uploads photos;
- enters project title and optional location;
- AI suggests:
  - category;
  - subcategory;
  - palette tags;
  - style tags;
  - block arrangement;
  - placeholder copy.

This should come after taxonomy is stable.
Otherwise the AI will generate inconsistent data.

## Implementation Order Recommendation

Recommended order:

1. admin project grouping by category;
2. subcategory model in backend and Prisma;
3. admin subcategory editor;
4. project form support for subcategory selection;
5. public bathroom/category sub-navigation;
6. filter metadata fields;
7. public filtering UI;
8. AI-assisted presets and generation.

## UI Notes For Admin

### Projects Tab

Replace the current flat wall of cards with:

- grouped sections by category;
- each section header includes:
  - category name;
  - project count;
  - collapse toggle;
- inside each group:
  - grid or compact list;
  - optional secondary grouping by subcategory later.

### Categories Tab

Should evolve from:

- simple category CRUD

to:

- category CRUD
- nested subcategory management
- ordering controls
- visibility rules

## Public UX Notes

### Category Page

When a category has subcategories:

- show subcategory switcher near the top;
- keep default view as `All`;
- do not hide projects behind a dropdown only;
- keep the visual flow portfolio-first, filter-second.

### Filters

Use filters only where they help discovery.
Do not overload small categories with unnecessary controls.

Recommended rule:

- filters appear only when a category has enough projects to justify them.

## Guardrails

- do not mix subcategories with free-form tags;
- do not overload main category names with style metadata;
- do not implement filter UI before metadata exists;
- do not rely on AI generation before taxonomy is stable;
- do not rebuild all routes at once if query-based filtering is enough for first pass.

## What This Roadmap Replaces

This roadmap does not replace the completed theme and layout work.
It becomes the next planning layer after:

- theme system foundation;
- project page blocks;
- admin project block editing.

It should be treated as the active direction for catalog structure.

## Next Recommended Planning Docs

When ready to implement, split this roadmap into these execution plans:

1. `admin-project-list-grouping-implementation`
2. `subcategory-data-model-implementation`
3. `admin-subcategory-editor-implementation`
4. `public-category-subnavigation-implementation`
5. `project-style-and-palette-filters-implementation`

## Historical Note

Keep existing earlier plans for now as historical implementation records.
Do not delete them yet unless a separate cleanup pass is requested.
