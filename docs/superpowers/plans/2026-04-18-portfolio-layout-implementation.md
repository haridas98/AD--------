# Portfolio Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize the public portfolio UI, add a stronger Home/Category presentation system, and improve ProjectPage frontend blocks without implementing heavy admin-side editors.

**Architecture:** Keep global SCSS limited to tokens, reset, container primitives, and shared utilities. Move page/component-specific visuals into CSS Modules, introduce reusable portfolio presentation components for Home/Category, and extend ProjectPage with frontend-only block components that render from data without requiring advanced admin tooling.

**Tech Stack:** React 18, TypeScript, React Router, Framer Motion, Sass/CSS Modules, Zustand, Vite, existing smoke script, Playwright package for lightweight browser verification scripts.

---

## File Structure

### Existing files to modify

- `src/App.tsx`
- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- `src/components/Layout.tsx`
- `src/components/blocks/index.tsx`
- `src/components/blocks/HeroImageBlock.tsx`
- `src/components/blocks/ImageGridBlock.tsx`
- `src/components/blocks/SideBySideBlock.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/CategoryPage.tsx`
- `src/pages/ProjectPage.tsx`
- `src/styles/styles.scss`
- `src/styles/_base.scss`
- `src/styles/_layout.scss`
- `src/styles/_blocks.scss`
- `src/styles/_pages.scss`

### New files to create

- `src/components/Header.module.scss`
- `src/components/Footer.module.scss`
- `src/components/PortfolioLeadCard.tsx`
- `src/components/PortfolioLeadCard.module.scss`
- `src/components/PortfolioProjectCard.tsx`
- `src/components/PortfolioProjectCard.module.scss`
- `src/pages/HomePage.module.scss`
- `src/pages/CategoryPage.module.scss`
- `src/pages/ProjectPage.module.scss`
- `src/components/blocks/RefinedSliderBlock.tsx`
- `src/components/blocks/RefinedSliderBlock.module.scss`
- `src/components/blocks/CircleDetailBlock.tsx`
- `src/components/blocks/CircleDetailBlock.module.scss`
- `src/components/blocks/EditorialNoteBlock.tsx`
- `src/components/blocks/EditorialNoteBlock.module.scss`
- `src/components/blocks/MosaicPresetBlock.tsx`
- `src/components/blocks/MosaicPresetBlock.module.scss`
- `scripts/ui-portfolio-check.mjs`

### Responsibility map

- Global SCSS files keep only app-wide layout primitives and reset behavior.
- `Header/Footer` modules own their local presentation and responsive behavior.
- `PortfolioLeadCard` owns homepage lead-project rendering.
- `PortfolioProjectCard` owns reusable large project card rendering for category/supporting grids.
- `HomePage.module.scss` and `CategoryPage.module.scss` own page-specific composition only.
- `ProjectPage.module.scss` owns page gutters, section rhythm, and block wrappers, but not individual block internals.
- Each new block component owns its own layout logic and CSS Module.
- `scripts/ui-portfolio-check.mjs` provides lightweight browser verification for layout regressions without adding new dependencies.

### Deferred items

Not part of this plan:

- admin crop-area selector for circular detail images;
- advanced admin mosaic editor with freeform spans;
- admin UI for manual image framing.

## Task 1: Container Foundation And Browser Verification Baseline

**Files:**
- Modify: `src/styles/_base.scss`
- Modify: `src/styles/_layout.scss`
- Modify: `src/styles/styles.scss`
- Create: `scripts/ui-portfolio-check.mjs`

- [ ] **Step 1: Write the failing browser verification script**

```js
import { chromium } from 'playwright';

const baseUrl = process.env.UI_BASE_URL || 'http://127.0.0.1:5173';

const routes = ['/', '/kitchens'];
const viewports = [
  { width: 390, height: 844, name: 'mobile' },
  { width: 1440, height: 900, name: 'desktop' },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch();
const page = await browser.newPage();

for (const viewport of viewports) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    const shell = page.locator('[data-page-shell]').first();
    await shell.waitFor();
    const box = await shell.boundingBox();
    assert(box, `Missing page shell on ${route} (${viewport.name})`);
  }
}

await browser.close();
```

- [ ] **Step 2: Run the verification script to confirm it fails**

Run:

```bash
npm run dev
node scripts/ui-portfolio-check.mjs
```

Expected: FAIL because `[data-page-shell]` does not exist yet.

- [ ] **Step 3: Implement the page-shell and container primitives**

Add stable primitives in `src/styles/_base.scss` and remove conflicting wide/narrow overrides:

```scss
:root {
  --page-gutter: clamp(12px, 2vw, 40px);
  --portfolio-max-width: 2200px;
  --text-max-width: 1280px;
  --header-offset: 72px;
}

.page-shell {
  width: 100%;
  padding-inline: var(--page-gutter);
}

.page-shell__portfolio {
  width: min(100%, var(--portfolio-max-width));
  margin: 0 auto;
}

.page-shell__text {
  width: min(100%, var(--text-max-width));
  margin: 0 auto;
}
```

- [ ] **Step 4: Add the page-shell marker for browser verification**

Introduce a shared wrapper in `src/components/Layout.tsx`:

```tsx
<div className="page-shell" data-page-shell>
  {children}
</div>
```

- [ ] **Step 5: Re-run the browser verification**

Run:

```bash
node scripts/ui-portfolio-check.mjs
```

Expected: PASS for wrapper presence on `/` and `/kitchens`.

- [ ] **Step 6: Commit**

```bash
git add src/styles/_base.scss src/styles/_layout.scss src/styles/styles.scss src/components/Layout.tsx scripts/ui-portfolio-check.mjs
git commit -m "refactor: add shared page shell and layout verification"
```

## Task 2: Header And Footer CSS Module Migration

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Footer.tsx`
- Create: `src/components/Header.module.scss`
- Create: `src/components/Footer.module.scss`
- Test: `scripts/ui-portfolio-check.mjs`

- [ ] **Step 1: Extend the browser check with header/footer assertions**

Append route-level checks:

```js
const header = page.locator('header').first();
const footer = page.locator('footer').first();

await header.waitFor();
await footer.waitFor();

const navLinks = await header.locator('a').count();
assert(navLinks > 0, `Header links missing on ${route}`);
```

- [ ] **Step 2: Run the browser check before migration**

Run:

```bash
node scripts/ui-portfolio-check.mjs
```

Expected: PASS, establishing a pre-refactor baseline.

- [ ] **Step 3: Move Header styles into a module without changing structure**

Use explicit class mapping in `src/components/Header.tsx`:

```tsx
import styles from './Header.module.scss';

<header className={`${styles.siteHeader} ${scrolled ? styles.scrolled : ''}`}>
  <div className={styles.inner}>
    <NavLink to="/" className={styles.brand}>Alexandra Diz</NavLink>
```

And in `src/components/Header.module.scss`:

```scss
.siteHeader {
  position: fixed;
  inset: 0 0 auto;
  z-index: 1000;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(8px);
}

.inner {
  width: min(100%, var(--portfolio-max-width));
  margin: 0 auto;
  padding-inline: var(--page-gutter);
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

- [ ] **Step 4: Move Footer styles into a module and align it to the same shell**

Use:

```tsx
import styles from './Footer.module.scss';

<footer className={styles.siteFooter}>
  <div className={styles.inner}>
```

With:

```scss
.inner {
  width: min(100%, var(--portfolio-max-width));
  margin: 0 auto;
  padding-inline: var(--page-gutter);
  display: flex;
  gap: 20px;
  justify-content: space-between;
  align-items: center;
}
```

- [ ] **Step 5: Re-run verification and build**

Run:

```bash
node scripts/ui-portfolio-check.mjs
npm run build
```

Expected: PASS browser checks; Vite build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx src/components/Footer.tsx src/components/Header.module.scss src/components/Footer.module.scss scripts/ui-portfolio-check.mjs
git commit -m "refactor: move header and footer to css modules"
```

## Task 3: Homepage Featured Lead And Supporting Grid

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Create: `src/pages/HomePage.module.scss`
- Create: `src/components/PortfolioLeadCard.tsx`
- Create: `src/components/PortfolioLeadCard.module.scss`
- Create: `src/components/PortfolioProjectCard.tsx`
- Create: `src/components/PortfolioProjectCard.module.scss`
- Test: `scripts/ui-portfolio-check.mjs`

- [ ] **Step 1: Extend the browser check to require homepage lead and supporting cards**

Add:

```js
if (route === '/') {
  const lead = page.locator('[data-home-lead]').first();
  const cards = page.locator('[data-portfolio-card]');
  await lead.waitFor();
  assert((await cards.count()) >= 1, 'Homepage supporting cards missing');
}
```

- [ ] **Step 2: Run the check to confirm it fails before implementation**

Run:

```bash
node scripts/ui-portfolio-check.mjs
```

Expected: FAIL because `[data-home-lead]` is not rendered.

- [ ] **Step 3: Create reusable portfolio card components**

In `src/components/PortfolioProjectCard.tsx`:

```tsx
import { Link } from 'react-router-dom';
import styles from './PortfolioProjectCard.module.scss';

export function PortfolioProjectCard({ to, title, image, eyebrow }: Props) {
  return (
    <Link to={to} className={styles.card} data-portfolio-card>
      <img src={image} alt={title} className={styles.image} />
      <div className={styles.overlay}>
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        <h3 className={styles.title}>{title}</h3>
      </div>
    </Link>
  );
}
```

In `src/components/PortfolioLeadCard.tsx`:

```tsx
export function PortfolioLeadCard({ to, title, image, categoryName }: Props) {
  return (
    <Link to={to} className={styles.lead} data-home-lead>
      <img src={image} alt={title} className={styles.image} />
      <div className={styles.overlay}>
        <span className={styles.eyebrow}>{categoryName}</span>
        <h3 className={styles.title}>{title}</h3>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Replace the homepage section loop with lead-plus-grid rendering**

Inside `src/pages/HomePage.tsx`, split category projects into lead + remainder:

```tsx
const featuredForCategory = catProjects.filter((p) => p.isFeatured);
const leadProject = featuredForCategory[0] ?? catProjects[0];
const supportingProjects = catProjects.filter((p) => p.id !== leadProject?.id).slice(0, 4);
```

Render:

```tsx
<section className={styles.categorySection}>
  <div className="page-shell__portfolio">
    <PortfolioLeadCard ... />
    <div className={styles.supportingGrid}>
      {supportingProjects.map((project) => <PortfolioProjectCard key={project.id} ... />)}
    </div>
  </div>
</section>
```

- [ ] **Step 5: Add homepage CSS module styling**

In `src/pages/HomePage.module.scss`:

```scss
.categorySection {
  padding-block: 48px 72px;
}

.supportingGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .supportingGrid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Re-run verification and build**

Run:

```bash
node scripts/ui-portfolio-check.mjs
npm run build
```

Expected: PASS; homepage now renders one lead card and supporting cards.

- [ ] **Step 7: Commit**

```bash
git add src/pages/HomePage.tsx src/pages/HomePage.module.scss src/components/PortfolioLeadCard.tsx src/components/PortfolioLeadCard.module.scss src/components/PortfolioProjectCard.tsx src/components/PortfolioProjectCard.module.scss scripts/ui-portfolio-check.mjs
git commit -m "feat: add homepage lead and supporting portfolio layout"
```

## Task 4: Category Page Standardization

**Files:**
- Modify: `src/pages/CategoryPage.tsx`
- Create: `src/pages/CategoryPage.module.scss`
- Reuse: `src/components/PortfolioProjectCard.tsx`
- Test: `scripts/ui-portfolio-check.mjs`

- [ ] **Step 1: Extend browser verification for two-column category layout**

Add:

```js
if (route === '/kitchens') {
  const cards = page.locator('[data-portfolio-card]');
  assert((await cards.count()) >= 1, 'Category cards missing');
}
```

- [ ] **Step 2: Run the browser check before refactor**

Run:

```bash
node scripts/ui-portfolio-check.mjs
```

Expected: PASS for existing cards, but no guarantee on layout consistency.

- [ ] **Step 3: Move CategoryPage to CSS Module layout**

Use:

```tsx
import styles from './CategoryPage.module.scss';

<main className={styles.page}>
  <div className="page-shell__portfolio">
    <header className={styles.header}>...</header>
    <div className={styles.grid}>
      {catProjects.map((project) => (
        <PortfolioProjectCard key={project.id} ... eyebrow={name} />
      ))}
    </div>
  </div>
</main>
```

- [ ] **Step 4: Apply large-card A layout rules**

In `src/pages/CategoryPage.module.scss`:

```scss
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

:global([data-portfolio-card]) {
  min-height: clamp(420px, 58vh, 860px);
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Verify build and mobile/desktop checks**

Run:

```bash
node scripts/ui-portfolio-check.mjs
npm run build
```

Expected: PASS with category cards still present and layout reduced to one column on narrow screens.

- [ ] **Step 6: Commit**

```bash
git add src/pages/CategoryPage.tsx src/pages/CategoryPage.module.scss scripts/ui-portfolio-check.mjs
git commit -m "feat: standardize category page portfolio grid"
```

## Task 5: Project Page Shell And Existing Block Polish

**Files:**
- Modify: `src/pages/ProjectPage.tsx`
- Create: `src/pages/ProjectPage.module.scss`
- Modify: `src/components/blocks/HeroImageBlock.tsx`
- Modify: `src/components/blocks/ImageGridBlock.tsx`
- Modify: `src/components/blocks/SideBySideBlock.tsx`
- Modify: `src/styles/_blocks.scss`
- Test: `scripts/ui-portfolio-check.mjs`

- [ ] **Step 1: Extend browser verification with project-route coverage**

Pick one real project slug from seeded content and add:

```js
const projectRoute = process.env.UI_PROJECT_ROUTE || '/kitchens/sample-project';
routes.push(projectRoute);
```

And assert:

```js
if (route === projectRoute) {
  const main = page.locator('[data-project-page]').first();
  await main.waitFor();
  assert(await main.isVisible(), 'Project page shell missing');
}
```

- [ ] **Step 2: Run the check and confirm failure on missing project shell marker**

Run:

```bash
UI_PROJECT_ROUTE=/kitchens/<real-slug> node scripts/ui-portfolio-check.mjs
```

Expected: FAIL because `[data-project-page]` is not present.

- [ ] **Step 3: Wrap ProjectPage in a module-based shell**

In `src/pages/ProjectPage.tsx`:

```tsx
import styles from './ProjectPage.module.scss';

<motion.main className={styles.page} data-project-page>
  <div className={styles.content}>
    <BlockRenderer blocks={content} />
  </div>
</motion.main>
```

In `src/pages/ProjectPage.module.scss`:

```scss
.page {
  padding-top: calc(var(--header-offset) + 20px);
}

.content {
  display: grid;
  gap: 32px;
}
```

- [ ] **Step 4: Normalize existing image blocks to the shared shell**

Update blocks to use the shared containers:

```tsx
<section className={styles.block}>
  <div className="page-shell__portfolio">
    ...
  </div>
</section>
```

For `HeroImageBlock`, keep a stable visual stage:

```tsx
<section className={styles.hero}>
  <img src={data.image} alt={...} className={styles.heroImage} />
  <div className={styles.overlay} />
</section>
```

- [ ] **Step 5: Re-run verification and build**

Run:

```bash
UI_PROJECT_ROUTE=/kitchens/<real-slug> node scripts/ui-portfolio-check.mjs
npm run build
```

Expected: PASS; ProjectPage has stable shell and no layout regressions in build.

- [ ] **Step 6: Commit**

```bash
git add src/pages/ProjectPage.tsx src/pages/ProjectPage.module.scss src/components/blocks/HeroImageBlock.tsx src/components/blocks/ImageGridBlock.tsx src/components/blocks/SideBySideBlock.tsx src/styles/_blocks.scss scripts/ui-portfolio-check.mjs
git commit -m "refactor: align project page blocks to shared layout system"
```

## Task 6: Refined Slider Block

**Files:**
- Create: `src/components/blocks/RefinedSliderBlock.tsx`
- Create: `src/components/blocks/RefinedSliderBlock.module.scss`
- Modify: `src/components/blocks/index.tsx`
- Test: `scripts/ui-portfolio-check.mjs`

- [ ] **Step 1: Add a failing browser check for slider thumbnails**

Add an optional project route assertion:

```js
const sliderThumbs = page.locator('[data-slider-thumb]');
assert((await sliderThumbs.count()) >= 1, 'Slider thumbnails missing');
```

Expected to fail until the block exists on a page using the new block type.

- [ ] **Step 2: Implement the block component**

Create `src/components/blocks/RefinedSliderBlock.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import styles from './RefinedSliderBlock.module.scss';

export default function RefinedSliderBlock({ data }) {
  const images = data.images || [];
  const [index, setIndex] = useState(0);
  const thumbPosition = data.thumbnailPosition || 'bottom';

  useEffect(() => {
    if (images.length < 2) return;
    const id = window.setInterval(() => setIndex((value) => (value + 1) % images.length), 15000);
    return () => window.clearInterval(id);
  }, [images.length]);

  const active = images[index];
  if (!active) return null;

  return (
    <section className={styles.block}>
      <div className={`${styles.layout} ${styles[`layout--${thumbPosition}`]}`}>
        <div className={styles.stage}>
          <button className={styles.hitLeft} onClick={() => setIndex((index - 1 + images.length) % images.length)} />
          <img src={active.url} alt={active.alt || ''} className={styles.image} />
          <button className={styles.hitRight} onClick={() => setIndex((index + 1) % images.length)} />
        </div>
        <div className={styles.thumbs}>
          {images.map((image, imageIndex) => (
            <button key={image.url} data-slider-thumb onClick={() => setIndex(imageIndex)} className={styles.thumb}>
              <img src={image.url} alt={image.alt || ''} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Keep the stage stable for mixed aspect ratios**

In `RefinedSliderBlock.module.scss`:

```scss
.stage {
  position: relative;
  min-height: clamp(320px, 62vh, 780px);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.hitLeft,
.hitRight {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 16%;
  background: transparent;
  border: 0;
}
```

- [ ] **Step 4: Register the new block type**

In `src/components/blocks/index.tsx`:

```tsx
import RefinedSliderBlock from './RefinedSliderBlock';

export const blockComponents = {
  ...,
  refinedSlider: RefinedSliderBlock,
};
```

- [ ] **Step 5: Re-run verification and build**

Run:

```bash
UI_PROJECT_ROUTE=/kitchens/<real-slider-slug> node scripts/ui-portfolio-check.mjs
npm run build
```

Expected: PASS when a project payload includes `refinedSlider` data.

- [ ] **Step 6: Commit**

```bash
git add src/components/blocks/RefinedSliderBlock.tsx src/components/blocks/RefinedSliderBlock.module.scss src/components/blocks/index.tsx scripts/ui-portfolio-check.mjs
git commit -m "feat: add refined project slider block"
```

## Task 7: Circle Detail, Editorial Note, And Mosaic Preset Blocks

**Files:**
- Create: `src/components/blocks/CircleDetailBlock.tsx`
- Create: `src/components/blocks/CircleDetailBlock.module.scss`
- Create: `src/components/blocks/EditorialNoteBlock.tsx`
- Create: `src/components/blocks/EditorialNoteBlock.module.scss`
- Create: `src/components/blocks/MosaicPresetBlock.tsx`
- Create: `src/components/blocks/MosaicPresetBlock.module.scss`
- Modify: `src/components/blocks/index.tsx`
- Test: `scripts/ui-portfolio-check.mjs`

- [ ] **Step 1: Add browser assertions for the new block markers**

Add markers:

```js
const circleBlocks = page.locator('[data-circle-detail]');
const mosaicBlocks = page.locator('[data-mosaic-preset]');
```

Expected to fail until the block components are implemented and present in content.

- [ ] **Step 2: Implement the circle detail block**

Create:

```tsx
export default function CircleDetailBlock({ data }) {
  const items = data.items || [];
  if (!items.length) return null;

  return (
    <section className={styles.block} data-circle-detail>
      <div className={styles.grid}>
        {items.map((item) => (
          <figure key={item.image} className={styles.item}>
            <div className={styles.media}>
              <img src={item.image} alt={item.alt || item.label || ''} />
            </div>
            {item.label ? <figcaption>{item.label}</figcaption> : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
```

With:

```scss
.grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 18px;
}

.media {
  aspect-ratio: 1;
  border-radius: 999px;
  overflow: hidden;
}
```

- [ ] **Step 3: Implement the editorial note block**

Create:

```tsx
export default function EditorialNoteBlock({ data }) {
  return (
    <section className={styles.block}>
      <div className={styles.inner}>
        <blockquote className={styles.note}>{data.note}</blockquote>
        {data.image ? <img src={data.image} alt={data.alt || ''} className={styles.image} /> : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Implement the mosaic preset block**

Create:

```tsx
const presetClassMap = {
  a: styles.presetA,
  b: styles.presetB,
};

export default function MosaicPresetBlock({ data }) {
  const images = data.images || [];
  const preset = data.preset || 'a';

  return (
    <section className={`${styles.block} ${presetClassMap[preset]}`} data-mosaic-preset>
      {images.slice(0, 4).map((image, index) => (
        <div key={image.url} className={styles.cell}>
          <img src={image.url} alt={image.alt || ''} />
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 5: Register all new block types**

In `src/components/blocks/index.tsx`:

```tsx
import CircleDetailBlock from './CircleDetailBlock';
import EditorialNoteBlock from './EditorialNoteBlock';
import MosaicPresetBlock from './MosaicPresetBlock';

export const blockComponents = {
  ...,
  circleDetail: CircleDetailBlock,
  editorialNote: EditorialNoteBlock,
  mosaicPreset: MosaicPresetBlock,
};
```

- [ ] **Step 6: Re-run verification and build**

Run:

```bash
UI_PROJECT_ROUTE=/kitchens/<real-block-slug> node scripts/ui-portfolio-check.mjs
npm run build
```

Expected: PASS when seeded/admin content includes the new block shapes.

- [ ] **Step 7: Commit**

```bash
git add src/components/blocks/CircleDetailBlock.tsx src/components/blocks/CircleDetailBlock.module.scss src/components/blocks/EditorialNoteBlock.tsx src/components/blocks/EditorialNoteBlock.module.scss src/components/blocks/MosaicPresetBlock.tsx src/components/blocks/MosaicPresetBlock.module.scss src/components/blocks/index.tsx scripts/ui-portfolio-check.mjs
git commit -m "feat: add project detail and mosaic preset blocks"
```

## Task 8: Final Verification Pass

**Files:**
- Modify: `scripts/ui-portfolio-check.mjs`
- Test: `scripts/ui-portfolio-check.mjs`

- [ ] **Step 1: Expand browser checks to cover mobile spacing and no-edge-sticking**

Add:

```js
const viewportWidth = page.viewportSize()?.width || 0;
const card = page.locator('[data-portfolio-card]').first();
const box = await card.boundingBox();

if (viewportWidth <= 390 && box) {
  assert(box.x >= 8, `Card is too close to left edge on ${route}`);
  assert(box.x + box.width <= viewportWidth - 8, `Card is too close to right edge on ${route}`);
}
```

- [ ] **Step 2: Run browser verification in dev**

Run:

```bash
npm run dev
node scripts/ui-portfolio-check.mjs
```

Expected: PASS on homepage, category page, and configured project route.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: Vite build succeeds without CSS-module import errors or unused route crashes.

- [ ] **Step 4: Run backend smoke test**

Run:

```bash
npm run test:smoke
```

Expected: `Smoke test passed.`

- [ ] **Step 5: Commit**

```bash
git add scripts/ui-portfolio-check.mjs
git commit -m "test: add portfolio layout verification coverage"
```

## Self-Review

### Spec coverage

- container system: covered by Task 1
- Header/Footer modularization: covered by Task 2
- HomePage lead/supporting layout: covered by Task 3
- CategoryPage A-layout: covered by Task 4
- ProjectPage shell and block polish: covered by Task 5
- refined slider with stable mixed-aspect stage: covered by Task 6
- circle detail, editorial note, and mosaic presets: covered by Task 7
- responsive verification and regression checks: covered by Task 8
- deferred admin crop/mosaic editor: intentionally excluded and documented in spec

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain.
- Each task lists exact files and explicit commands.
- Every code-writing step includes concrete code snippets.

### Type consistency

- New block type names are consistent across tasks:
  - `refinedSlider`
  - `circleDetail`
  - `editorialNote`
  - `mosaicPreset`
- Shared card markers are consistent:
  - `[data-home-lead]`
  - `[data-portfolio-card]`
  - `[data-project-page]`
  - `[data-slider-thumb]`
  - `[data-circle-detail]`
  - `[data-mosaic-preset]`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-18-portfolio-layout-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
