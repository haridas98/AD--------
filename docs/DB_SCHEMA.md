# DB Schema

## Status
- ORM: Prisma (`server/prisma/schema.prisma`)
- Current provider in schema: `sqlite`
- Target provider: `postgresql` (same logical tables, PostgreSQL connection in `DATABASE_URL`)

## Tables (Prisma Models)

### `Category`
- PK: `id` (String UUID)
- Unique: `slug`
- Fields: `name`, `description`, `showInHeader`, `sortOrder`, `createdAt`, `updatedAt`
- Relation: one-to-many with `Project` (`Category.projects`)

### `Project`
- PK: `id` (String UUID)
- Unique: `slug`
- Indexed: `categoryId`, `isFeatured`, `isPublished`, `cityName`, `year`
- Fields:
  - content/meta: `title`, `slug`, `content` (JSON serialized string), `isFeatured`, `isPublished`, `sortOrder`
  - seo: `seoTitle`, `seoDescription`, `seoKeywords`, `canonicalUrl`
  - location/time: `categoryId`, `locationId`, `cityName`, `year`
  - audit: `createdAt`, `updatedAt`
- Relation: many-to-one to `Category` with `onDelete: Cascade`

### `BlogPost`
- PK: `id` (String UUID)
- Unique: `slug`
- Indexed: `isPublished`, `publishedAt`
- Fields: `title`, `slug`, `excerpt`, `coverImage`, `content`, `isPublished`, `publishedAt`, `tags`, `seo*`, `createdAt`, `updatedAt`

### `Location`
- PK: `id` (String UUID)
- Unique composite: `(city, state)`
- Fields: `city`, `state`, `country`, `isActive`, `createdAt`
- Note: relation from `Project.locationId` is not declared in current Prisma schema.

## Key Relationship Graph
- `Category (1) -> (N) Project`
- `Location` is currently independent model (no active Prisma relation).

## PostgreSQL Migration Notes
- Keep table semantics from models above.
- Move `createdAt`, `updatedAt`, `publishedAt` to PostgreSQL-friendly temporal types in future migration step.
- Prefer `Json` column type for rich `Project.content` when migrating from string storage.
- Add explicit FK `Project.locationId -> Location.id` if location normalization is required.

