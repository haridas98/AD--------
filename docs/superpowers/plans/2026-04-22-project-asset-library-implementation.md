# Project Asset Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a real project-scoped media library so project pages stop storing duplicated raw image URLs inside blocks and start reusing asset records with usage-level framing.

**Architecture:** Add Prisma models for project assets and asset usages, keep filesystem storage under project-specific folders, migrate existing project block URLs into asset rows, and update the admin so blocks choose from the project library instead of performing isolated uploads. Maintain backward-compatible frontend rendering while the migration rolls out.

**Tech Stack:** Express, Prisma, SQLite now with PostgreSQL-safe schema direction, React, TypeScript, existing admin project editor, existing upload pipeline with `multer` and `sharp`.

---

## File Structure

### Existing files to modify

- `server/prisma/schema.prisma`
- `server/index.js`
- `server/prisma/seed.ts`
- `src/types/index.ts`
- `src/pages/AdminPage.tsx`
- `src/components/blocks/index.tsx`
- project block editor helpers already embedded in `src/pages/AdminPage.tsx`
- public project rendering files that currently resolve direct URLs from block data

### New backend files

- `server/lib/project-assets.js`
- `server/lib/project-asset-sync.js`
- `server/lib/project-asset-migration.js`
- `server/scripts/migrate-project-assets.mjs`

### New frontend files

- `src/components/admin/ProjectAssetLibrary.tsx`
- `src/components/admin/ProjectAssetLibrary.module.scss`
- `src/components/admin/ProjectAssetPicker.tsx`
- `src/components/admin/ProjectAssetPicker.module.scss`
- `src/components/admin/AssetUsageCropModal.tsx`
- `src/components/admin/AssetUsageCropModal.module.scss`

### Responsibility map

- `project-assets.js` owns storage helpers, file path generation, and asset CRUD helpers.
- `project-asset-sync.js` owns folder scan and DB synchronization.
- `project-asset-migration.js` owns import of current URL-based block media into asset rows.
- `migrate-project-assets.mjs` runs one-off migration safely and reports results.
- `ProjectAssetLibrary` renders the project-level media library tab.
- `ProjectAssetPicker` is the reusable chooser used by block editors.
- `AssetUsageCropModal` owns visual framing for one selected usage.

---

### Task 1: Add Prisma Models For Project Assets

**Files:**
- Modify: `server/prisma/schema.prisma`
- Test: `server/prisma/migrations/*`

- [ ] Add `ProjectAsset` model linked to `Project`.
- [ ] Add `ProjectAssetUsage` model linked to `ProjectAsset` and `Project`.
- [ ] Keep enums string-based if that matches the current schema style and avoids SQLite friction.
- [ ] Include fields for image/video support from day one:
  - `kind`
  - `storagePath`
  - `publicUrl`
  - `originalFilename`
  - `mimeType`
  - `width`
  - `height`
  - `durationMs`
  - `fileSize`
  - `checksum`
  - `status`
  - `sourceType`
  - `sourcePath`
  - `altText`
  - `caption`
  - `sortOrder`
- [ ] Include usage fields for framing:
  - `blockId`
  - `slotKey`
  - `usageType`
  - `cropX`
  - `cropY`
  - `cropScale`
  - `focalX`
  - `focalY`
  - `aspectRatio`
  - `captionOverride`
  - `labelOverride`
  - `sortOrder`
- [ ] Add indexes for:
  - `projectId`
  - `checksum`
  - `kind`
  - `blockId`
  - `assetId`
- [ ] Run:

```bash
npx prisma migrate dev --schema=server/prisma/schema.prisma
npx prisma generate --schema=server/prisma/schema.prisma
```

- [ ] Verify the generated migration does not alter unrelated tables.

### Task 2: Create Project Asset Storage Helpers

**Files:**
- Create: `server/lib/project-assets.js`
- Modify: `server/index.js`

- [ ] Centralize project asset path creation under:

```text
public/uploads/projects/<project-slug>/images/original
public/uploads/projects/<project-slug>/videos/original
```

- [ ] Add helpers to:
  - ensure project directories exist;
  - normalize project asset filenames;
  - compute public URLs;
  - compute file checksum;
  - derive metadata with `sharp` for images.
- [ ] Stop treating project media as flat files in `/uploads`.
- [ ] Keep old `/uploads/...` serving working for legacy files already stored there.
- [ ] Add a helper so project creation can eagerly create its media folder.

### Task 3: Add Admin Asset API Endpoints

**Files:**
- Modify: `server/index.js`
- Create: `server/lib/project-assets.js`

- [ ] Add endpoints:
  - `GET /api/admin/projects/:id/assets`
  - `POST /api/admin/projects/:id/assets/upload`
  - `POST /api/admin/projects/:id/assets/import-url`
  - `POST /api/admin/projects/:id/assets/sync`
  - `PATCH /api/admin/projects/:id/assets/:assetId`
  - `DELETE /api/admin/projects/:id/assets/:assetId`
- [ ] Make upload from block editors land in the project library first.
- [ ] Return structured asset records, not only URLs.
- [ ] Reject deletion when an asset is still used, or downgrade deletion to `archived`.
- [ ] Preserve current auth contract with `requireAuth`.

### Task 4: Build Folder Sync

**Files:**
- Create: `server/lib/project-asset-sync.js`
- Modify: `server/index.js`

- [ ] Implement a project-folder scan that:
  - reads image/video files from the project directory;
  - creates missing `ProjectAsset` rows;
  - updates metadata if needed;
  - marks absent files as `missing` instead of deleting rows.
- [ ] Deduplicate within one project using:
  - `storagePath`
  - then `checksum`
- [ ] Return a sync summary:
  - created
  - updated
  - marked missing
  - skipped duplicates
- [ ] Keep sync explicit via API button, not automatic on every page load.

### Task 5: Extend Shared Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] Add `ProjectAsset` and `ProjectAssetUsage` interfaces.
- [ ] Extend block item typing so blocks can carry `assetId`, `usageId`, or legacy `image` URL fields during migration.
- [ ] Do not break current consumers that still expect raw strings.
- [ ] Add small helper unions instead of rewriting every block type at once.

### Task 6: Add Project Asset Library UI In Admin

**Files:**
- Create: `src/components/admin/ProjectAssetLibrary.tsx`
- Create: `src/components/admin/ProjectAssetLibrary.module.scss`
- Modify: `src/pages/AdminPage.tsx`

- [ ] Add an `Assets` tab to the project editor.
- [ ] Render:
  - media grid;
  - used/unused status;
  - type badge;
  - upload button;
  - import URL action;
  - sync folder button.
- [ ] Keep the first version simple:
  - no drag-and-drop reordering required yet;
  - no bulk operations yet.
- [ ] Show where an asset is used if the data exists.
- [ ] Make the library readable on mobile admin too.

### Task 7: Add Asset Picker For Blocks

**Files:**
- Create: `src/components/admin/ProjectAssetPicker.tsx`
- Create: `src/components/admin/ProjectAssetPicker.module.scss`
- Modify: `src/pages/AdminPage.tsx`

- [ ] Replace direct one-off image upload flow in block editors with:
  - choose from project library;
  - upload into project library;
  - optional import by URL.
- [ ] Reuse one picker across:
  - `heroImage`
  - `imageGrid`
  - `sideBySide`
  - `beforeAfter`
  - `refinedSlider`
  - `circleDetail`
  - `mosaicPreset`
- [ ] Preserve existing fields temporarily where needed, but make library selection the default path.
- [ ] Keep the UI fast and minimal; avoid creating a separate mini-CMS inside each block.

### Task 8: Add Usage-Level Crop Modal

**Files:**
- Create: `src/components/admin/AssetUsageCropModal.tsx`
- Create: `src/components/admin/AssetUsageCropModal.module.scss`
- Modify: `src/pages/AdminPage.tsx`

- [ ] Reuse the existing visual crop idea already added for some fields.
- [ ] Save crop/focus to usage metadata instead of writing duplicate files.
- [ ] Make portrait-to-landscape fitting available for blocks that need horizontal output:
  - before/after
  - mosaic
  - slider thumbnails
  - circle details
- [ ] Keep "full image" blocks free from forced crop when possible.

### Task 9: Add Backend Migration For Existing Block URLs

**Files:**
- Create: `server/lib/project-asset-migration.js`
- Create: `server/scripts/migrate-project-assets.mjs`

- [ ] Read every project's `content` JSON.
- [ ] Collect all currently used media URLs from known block types.
- [ ] For each unique URL inside one project:
  - resolve the local file if it exists;
  - create one `ProjectAsset` row;
  - map repeated uses to the same asset.
- [ ] Create usage rows for known placements when block structure allows it.
- [ ] Produce a migration report showing:
  - projects scanned;
  - assets created;
  - repeated URLs merged;
  - URLs skipped because the file could not be resolved.
- [ ] Keep the migration idempotent.

### Task 10: Add Runtime Compatibility Layer

**Files:**
- Modify: block rendering files under `src/components/blocks/`
- Modify: `src/components/blocks/index.tsx`

- [ ] Add helpers that can resolve media from either:
  - legacy direct URL fields;
  - new asset-linked fields.
- [ ] Keep public rendering unchanged visually while the data model transitions.
- [ ] Avoid requiring a full content rewrite before deployment.

### Task 11: Add Seed And Demo Support

**Files:**
- Modify: `server/prisma/seed.ts`

- [ ] Seed at least one project with library assets so the feature is visible in a clean environment.
- [ ] Do not seed duplicate asset rows for the same file.
- [ ] Ensure seeded demo content exercises:
  - single image use;
  - repeated asset reuse;
  - usage-specific framing.

### Task 12: Verification

**Files:**
- Modify as needed during fixes only

- [ ] Run backend smoke checks:

```bash
npm run test:smoke
```

- [ ] Run Prisma generation and confirm client compiles:

```bash
npx prisma generate --schema=server/prisma/schema.prisma
```

- [ ] Run local app and verify these flows manually:
  - login to admin;
  - create project;
  - confirm media folder exists;
  - upload asset into project library;
  - add that asset to multiple blocks;
  - crop one usage differently from another;
  - save project;
  - confirm public page still renders;
  - run project-folder sync.
- [ ] Verify legacy projects without migrated assets still render.

### Task 13: Cleanup And Follow-Up

**Files:**
- Modify docs if needed

- [ ] Remove or downgrade old block-level upload helpers that are no longer the preferred path.
- [ ] Document any remaining legacy compatibility behavior.
- [ ] Leave cross-project dedupe, AI auto-composition, and advanced video editing for later follow-up work.

---

## Recommended Execution Order

1. Prisma schema and migration.
2. Backend storage helpers and asset API.
3. Admin `Assets` tab.
4. Shared asset picker and crop modal.
5. Migration script for current block URLs.
6. Frontend compatibility layer.
7. Verification and cleanup.

## Risks To Watch

- old projects currently rely on raw URLs inside block JSON;
- migration may find URLs that no longer exist on disk;
- block schemas are heterogeneous, so URL extraction must be explicit per block type;
- SQLite is fine for the first pass, but schema should stay PostgreSQL-friendly;
- deleting assets must not silently break public pages.

## Recommendation

Implement this as a compatibility-first migration, not a rewrite.

The correct path is:

- introduce assets and usages;
- keep old blocks working;
- migrate media progressively;
- make the project library the default editing path;
- only then reduce legacy raw URL behavior.
