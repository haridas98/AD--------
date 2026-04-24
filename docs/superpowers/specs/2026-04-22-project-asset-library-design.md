# Project Asset Library Design

Date: 2026-04-22
Scope: project-scoped media library, deduplicated asset usage, admin asset workflow, and migration away from raw image URLs inside project blocks

## Goal

Replace the current "paste image URL directly into blocks" approach with a proper project asset library so that:

- one project owns one media library;
- the same image is stored once and reused many times;
- project blocks reference library assets instead of raw URLs;
- per-block framing stays flexible without duplicating source files;
- the admin matches the real workflow: create project -> add media to its folder/library -> use those assets in blocks.

## Current Problem

Right now the project system behaves like a visual builder on top of raw files.

That creates several problems:

- the same image can be uploaded multiple times under different block fields;
- a project does not have a clear source-of-truth media library;
- blocks mix content structure and storage concerns;
- future video support will become messy if it follows the same pattern;
- future AI-assisted page generation will have no structured asset pool to work from.

The current architecture is acceptable for rapid prototyping, but not as a long-term portfolio CMS.

## Design Principles

### 1. Project-first media ownership

Each asset belongs to one project library first.

The default rule is:

- create project;
- create or attach its media folder;
- sync that folder into the project asset library;
- use those assets in blocks.

This keeps admin behavior intuitive and mirrors how the owner already thinks about projects.

### 2. Store once, use many times

An uploaded image or video should exist once as an asset record.

Blocks should only reference the asset and describe how it is used in that block:

- crop;
- focus area;
- aspect ratio preference;
- caption override;
- label override;
- ordering.

The asset itself should not be duplicated just because it appears in:

- hero;
- slider;
- circle details;
- before/after;
- grid;
- mosaic.

### 3. Usage-level framing, not file-level duplication

The same image may need different framing in different blocks.

Example:

- one image is used as a full-width hero;
- the same image is also used as a circular detail;
- the same image is also used as a thumbnail in a slider.

That means crop data must live on the usage side, not only on the asset side.

### 4. Folder import is a first-class workflow

The owner wants to create a project folder and drop media there.

The system should support that directly instead of forcing every asset through a one-by-one manual upload flow.

### 5. The library must work before AI features

Future AI generation depends on a stable asset model.

Do not build AI generation on top of raw block URLs.

## Target User Workflow

### Base workflow

1. Admin creates a new project.
2. The system creates a default media folder for that project.
3. The owner places images and videos into that folder, or uploads them through admin.
4. Admin shows those files as the project library.
5. When editing blocks, the user picks assets from the project library instead of uploading the same file again.

### Extended workflow

Later the owner should also be able to:

- rescan the folder;
- replace an asset file while keeping its usage links;
- see unused assets;
- see where an asset is used;
- filter library items by type:
  - images;
  - videos;
  - unused;
  - used in blocks.

## Storage Model

## Filesystem Structure

Recommended structure:

```text
public/uploads/projects/
  <project-slug>/
    images/
      original/
      derived/
    videos/
      original/
    imports/
```

### Notes

- `images/original` keeps original uploaded or imported images.
- `images/derived` is reserved for future generated variants if needed.
- `videos/original` keeps source video files.
- `imports` is optional and can hold temporary sync manifests if needed.

For the first implementation pass, `derived` can stay mostly unused.
It exists to avoid redesign later.

## Database Model

Recommended new model:

### `ProjectAsset`

One row per real media file belonging to a project.

Suggested fields:

- `id`
- `projectId`
- `kind`
  - `image`
  - `video`
- `storagePath`
- `publicUrl`
- `originalFilename`
- `mimeType`
- `width`
- `height`
- `durationMs` for video
- `fileSize`
- `checksum`
- `status`
  - `active`
  - `missing`
  - `archived`
- `sourceType`
  - `upload`
  - `folder-sync`
  - `remote-import`
- `sourcePath`
- `altText`
- `caption`
- `sortOrder`
- `createdAt`
- `updatedAt`

### `ProjectAssetUsage`

One row per placement of an asset inside the project page structure.

Suggested fields:

- `id`
- `projectId`
- `assetId`
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
- `createdAt`
- `updatedAt`

### Why a separate usage table

This is the clean boundary:

- `ProjectAsset` answers: what file is this?
- `ProjectAssetUsage` answers: how is this file used here?

Without this split, the app will eventually reintroduce duplication.

## Block Data Model Change

Current blocks mostly store direct URLs.

Target direction:

- blocks should store references like `assetId` or arrays of `assetId`s;
- usage-specific framing should be stored with usage metadata;
- raw URLs inside blocks should become a compatibility layer, not the long-term model.

### Example direction

Instead of:

```json
{
  "type": "circleDetail",
  "data": {
    "items": [
      { "image": "/uploads/file-a.jpg", "label": "Detail 1" }
    ]
  }
}
```

Move toward:

```json
{
  "type": "circleDetail",
  "data": {
    "items": [
      { "assetId": "asset_123", "usageId": "usage_456", "label": "Detail 1" }
    ]
  }
}
```

The exact block shape can stay backward-compatible during migration.

## Admin UI Model

## Project Editor Tabs

Recommended project editor structure:

- `Content`
- `Assets`
- `SEO`
- `Settings`

### `Assets` tab

This becomes the project's media library view.

It should show:

- image/video grid;
- usage state;
- file metadata;
- import/upload actions;
- rescan/sync action;
- lightweight preview;
- delete/archive action.

## Asset Selection In Blocks

When editing a block:

- do not upload blindly into that block field;
- open the project asset picker;
- allow:
  - choose existing asset;
  - upload new file into project library;
  - import from URL if really needed.

If the user uploads or imports from inside a block editor, the file still lands in the project asset library first.

That is the critical rule.

## Crop / Framing UX

For cases like circles, before/after fallback crops, thumbnails, and portrait-to-landscape framing:

- use an editing modal after choosing the source image;
- the modal edits usage framing, not the original asset file;
- save crop/focus values with the usage entry.

This matches the owner's request and avoids polluting the form with crude numeric controls.

## Folder Sync Model

## What sync should do

Folder sync should:

- scan the project folder;
- detect images and videos;
- create missing `ProjectAsset` entries;
- mark missing files as `missing` instead of silently deleting references;
- reuse existing rows when the same file is already known;
- optionally identify the same binary via checksum.

## What sync should not do

Folder sync should not:

- rewrite block content directly without explicit migration logic;
- guess layout structure;
- delete asset usage automatically;
- duplicate assets just because filenames differ.

## Deduplication Rules

Recommended deduplication order:

1. exact `storagePath` match;
2. exact `checksum` match inside the same project;
3. optional later cross-project duplicate detection, but not required now.

For the first pass, dedupe within one project only.
Cross-project dedupe adds complexity and is not necessary yet.

## Video Support

The library must support video from the data model stage, even if the first UI pass remains image-focused.

That means:

- `ProjectAsset.kind` must already allow `video`;
- admin asset grid must be able to distinguish image vs video;
- block definitions can stay image-first initially, but the asset system must not assume everything is an image.

## Migration Strategy

## Phase 1: Introduce library without breaking public rendering

- add new asset tables;
- keep current block rendering working;
- keep current raw URL fields accepted.

## Phase 2: Import current files into project libraries

For each project:

- inspect block content;
- collect image URLs currently used;
- create asset rows for those files;
- map repeated URLs to one asset row.

## Phase 3: Backfill block references

- update block data so repeated URLs become asset references;
- keep compatibility for any block entries not migrated yet.

## Phase 4: Make library the default editor path

After migration:

- new block items should use asset picking first;
- raw ad-hoc uploads become legacy behavior or disappear entirely.

## Legacy Compatibility

During migration, frontend rendering must support both:

- old URL-based block values;
- new asset-based block values.

This avoids a risky all-at-once rewrite.

## Future AI Integration

Once the asset library exists, AI generation becomes realistic.

The future AI workflow can be:

1. project is created;
2. media folder is filled;
3. sync imports assets;
4. AI receives:
   - project title;
   - location;
   - category/subcategory;
   - asset library metadata;
5. AI proposes:
   - block composition;
   - candidate hero assets;
   - before/after pairs;
   - detail circles;
   - placeholder copy.

Without the library, AI would only be generating layout around fragile URLs.

## In Scope For The First Real Implementation

- project asset tables in Prisma;
- project-scoped media folder structure;
- admin project asset library tab;
- upload into project library;
- block asset picker;
- usage-level crop/focus persistence;
- migration of current project image URLs into project assets;
- compatibility layer for old block data.

## Out Of Scope For The First Real Implementation

- global site-wide DAM;
- cross-project asset reuse;
- full video editing UI;
- automated AI page generation;
- automatic style/palette tagging from AI;
- CDN optimization pipeline;
- heavy media processing infrastructure.

## Recommendation

The correct long-term direction is:

- project-scoped asset library;
- deduplicated asset records;
- separate usage records for crop/framing;
- folder sync as a real admin workflow;
- block editors selecting from the project library instead of re-uploading files into block fields.

That gives a clean path for:

- better admin usability;
- fewer duplicate files;
- safer future migrations;
- AI-assisted project generation later.
