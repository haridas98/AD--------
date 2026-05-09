# AI Agent Site Guide

## Source of Truth
- Public app: `src/`
- Admin app: `src/pages/AdminPage.tsx`
- API: `server/index.js`
- DB schema: `server/prisma/schema.prisma`
- Public uploads: `public/uploads`
- Legacy reference only: `public/legacy`, `dist/legacy`
- Do not delete legacy folders unless explicitly asked.

## Runtime
- Docker/local production URL: `http://localhost:8787`
- Dev client: Vite usually uses `http://localhost:3000`; API stays on `http://localhost:8787`.
- Production build is copied into `public/` inside Docker and served by Express.
- Useful checks:
  - `npm run build`
  - `npm run test:smoke`
  - `npm run deploy:up`

## Admin
- Admin route: `/admin`
- API auth uses `/api/auth/login`; token is stored as `ad_admin_token`.
- Main admin endpoint: `/api/admin/content`
- Admin can edit:
  - projects
  - categories
  - blog posts
  - testimonials
  - homepage settings
  - theme colors
  - project asset libraries

## SEO
- Project SEO is edited in Admin -> Projects -> SEO Settings.
- Project SEO fields are stored in DB: `Project.seoTitle`, `seoDescription`, `seoKeywords`.
- Blog SEO is edited in Admin -> Blog -> SEO.
- Blog SEO fields are stored in DB: `BlogPost.seoTitle`, `seoDescription`, `seoKeywords`.
- Homepage SEO is edited in Admin -> Home page -> SEO.
- Homepage SEO is stored in `data/homepage-settings.json` under `seo`.
- Public pages must prefer admin SEO values and only use code fallback when admin fields are empty.
- Technical SEO helpers live in `src/lib/seo.ts`.
- Sitemap/robots are served by `server/index.js`:
  - `/sitemap.xml`
  - `/robots.txt`

## Gemini AI
- Gemini config comes from env:
  - `GEMINI_API_KEY`
  - `GOOGLE_AI_API_KEY` fallback
  - `GEMINI_MODEL`
- Existing AI routes:
  - `POST /api/admin/projects/:id/ai/generate-page`
  - `POST /api/admin/ai/generate-text`
  - `POST /api/admin/ai/generate-seo`
- Gemini SEO should fill admin fields, not hardcode metadata in React pages.
- Project page draft generation can fill content blocks plus SEO.
- Separate SEO generation should not rewrite project content blocks.

## Projects
- Canonical project/category routes live in `src/lib/portfolioRoutes.ts`.
- Project content is JSON blocks stored as a string in `Project.content`.
- Block helpers:
  - `src/lib/projectBlockTemplates.ts`
  - `src/components/blocks/*`
- Public project page: `src/pages/ProjectPage.tsx`
- Project lists/categories: `src/pages/CategoryPage.tsx`, `src/pages/ProjectsLandingPage.tsx`
- New projects must not be generated as only `heroImage + imageGrid + refinedSlider`.
- Use the existing Admin project presets/block system when creating or regenerating project pages.
- Preferred rich project structure:
  - `heroImage`
  - `metaInfo`
  - `editorialNote`
  - `typography`
  - `imageGrid`
  - `sideBySide`
  - `refinedSlider`
  - `mosaicPreset`
  - closing `typography`
  - `ctaSection`
- These block types already exist in Admin and frontend; do not create new block types for this.
- For new/imported projects, generate content through the preset-style structure above so pages feel like the deployed reference site, not a thin gallery.
- Put live/finished photos first in every project. Renders should be used only after real photos, at the end of galleries/sliders, unless the user explicitly asks otherwise.

## Photos and Assets
- Physical project files:
  - `public/uploads/projects/<project-slug>/images/original`
  - `public/uploads/projects/<project-slug>/images/derived`
  - `public/uploads/projects/<project-slug>/videos/original`
- Public URLs:
  - `/uploads/projects/<project-slug>/images/original/<file>`
- DB table: `ProjectAsset`
- Asset usage/crops: `ProjectAssetUsage`
- Admin asset tab calls:
  - `GET /api/admin/projects/:id/assets`
  - `POST /api/admin/projects/:id/assets/upload`
  - `POST /api/admin/projects/:id/assets/import-url`
  - `POST /api/admin/projects/:id/assets/sync`
- `Sync folder` reads only `public/uploads/projects/<slug>`, not external folders.
- Parsed legacy image archive:
  - `scripts/site-image-archive/alexandradiz.com/_`
- External folder imports from `E:\AD` are manual/script work and must be mapped by project folder names.

## Image Quality
- Site previews should use lighter derived images when available.
- Fullscreen/lightbox views may use original quality.
- Duplicate filtering uses checksum and visual hash logic in asset scripts/libs.
- Do not add duplicate photos just because filenames differ.

## Homepage
- Homepage copy/images are in admin homepage settings, normalized by:
  - `src/lib/homepageSettings.ts`
  - `server/homepage-settings.js`
- Homepage settings are stored in:
  - local/Docker runtime: `data/homepage-settings.json`
- Public homepage: `src/pages/HomePage.tsx`
- Homepage should prioritize live finished photos without people, especially for portfolio sections.

## Important Rules
- Admin is the editing source for content and SEO.
- Code should provide defaults/fallbacks, not override admin values.
- Keep API contracts stable.
- Keep changes scoped.
- After backend changes run `npm run test:smoke`.
- After frontend changes run `npm run build`.
