# Homepage Personal Brand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public IA so the site uses SEO-friendly `/projects/...` routes, a dropdown-based portfolio nav, and a new personal-brand homepage centered on Alexandra Diz with projects, blog, testimonials, and contact entry points.

**Architecture:** Centralize public portfolio route definitions first, then update `App.tsx` and `Header.tsx` to consume that route map so navigation and links stop drifting apart. Rebuild the homepage as a composition of focused, CSS-module-based sections that use existing store data for projects and blog posts, while keeping placeholder media isolated in one draft-content module until final owner assets arrive.

**Tech Stack:** React 18, TypeScript, React Router, Framer Motion, Zustand, Sass/CSS Modules, Playwright (via lightweight verification script), existing Vite build and smoke test.

---

## File Structure

### Existing files to modify

- `src/App.tsx`
- `src/components/Header.tsx`
- `src/components/Header.module.scss`
- `src/pages/HomePage.tsx`
- `src/pages/HomePage.module.scss`
- `src/components/Layout.tsx`
- `src/styles/_layout.scss`

### New files to create

- `src/lib/portfolioRoutes.ts`
- `src/content/homepageDraft.ts`
- `src/components/home/HomeHero.tsx`
- `src/components/home/HomeHero.module.scss`
- `src/components/home/HomeIntro.tsx`
- `src/components/home/HomeIntro.module.scss`
- `src/components/home/HomeServices.tsx`
- `src/components/home/HomeServices.module.scss`
- `src/components/home/HomeProcess.tsx`
- `src/components/home/HomeProcess.module.scss`
- `src/components/home/HomeProjectsGateway.tsx`
- `src/components/home/HomeProjectsGateway.module.scss`
- `src/components/home/HomeTestimonials.tsx`
- `src/components/home/HomeTestimonials.module.scss`
- `src/components/home/HomeBlogPreview.tsx`
- `src/components/home/HomeBlogPreview.module.scss`
- `src/components/home/HomeFinalCta.tsx`
- `src/components/home/HomeFinalCta.module.scss`
- `scripts/ui-homepage-check.mjs`

### Responsibility map

- `src/lib/portfolioRoutes.ts` owns canonical public routes and dropdown definitions for project categories.
- `src/content/homepageDraft.ts` owns temporary homepage copy, testimonial data, and placeholder media references.
- `src/components/home/*` own one homepage section each to keep `HomePage.tsx` compositional instead of monolithic.
- `src/pages/HomePage.tsx` orchestrates homepage data selection from store plus draft content.
- `src/pages/HomePage.module.scss` owns only page-level section spacing, not individual section visuals.
- `scripts/ui-homepage-check.mjs` verifies the new route tree, header dropdown, and homepage section markers in the browser.

### Deferred items

Not part of this plan:

- admin-side homepage editor;
- final production video asset management;
- copywriting approval pass from owner;
- route redirects from every legacy public URL;
- blog page redesign beyond linking it from the new homepage.

## Task 1: Canonical Portfolio Routes And Browser Baseline

**Files:**
- Create: `src/lib/portfolioRoutes.ts`
- Modify: `src/App.tsx`
- Test: `scripts/ui-homepage-check.mjs`

- [ ] **Step 1: Write the failing browser verification script**

Create `scripts/ui-homepage-check.mjs`:

```js
import { chromium } from 'playwright';

const baseUrl = process.env.UI_BASE_URL || 'http://127.0.0.1:5173';
const routes = ['/', '/projects', '/projects/kitchens', '/blog'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

for (const route of routes) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  const body = await page.locator('body').textContent();
  assert(body && body.trim().length > 0, `Empty page at ${route}`);
}

await browser.close();
```

- [ ] **Step 2: Run the browser check to confirm route coverage fails**

Run:

```bash
npm run dev
node scripts/ui-homepage-check.mjs
```

Expected: FAIL because `/projects` and `/projects/kitchens` are not routed yet.

- [ ] **Step 3: Create the canonical public route map**

Create `src/lib/portfolioRoutes.ts`:

```ts
export const projectCategoryRoutes = [
  { id: 'kitchens', label: 'Kitchens', href: '/projects/kitchens' },
  { id: 'full-house-remodeling', label: 'Full House', href: '/projects/full-house' },
  { id: 'bathrooms', label: 'Bathroom', href: '/projects/bathroom' },
  { id: 'adu1', label: 'ADU', href: '/projects/adu' },
  { id: 'fireplaces', label: 'Fireplaces', href: '/projects/fireplaces' },
] as const;

export const publicNavItems = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects', sub: projectCategoryRoutes.map(({ label, href }) => ({ label, href })) },
  { label: 'Blog', href: '/blog' },
  { label: 'Video', href: '/video-series' },
  { label: 'Services', href: '/process' },
  { label: 'About', href: '/aboutme' },
  { label: 'Contact', href: '/contact' },
] as const;

export function getProjectCategoryHref(categoryId: string) {
  const match = projectCategoryRoutes.find((route) => route.id === categoryId);
  return match?.href || '/projects';
}

export function getProjectHref(categoryId: string, slug: string) {
  return `${getProjectCategoryHref(categoryId)}/${slug}`;
}
```

- [ ] **Step 4: Move `App.tsx` to the new route tree**

Update the portfolio routes in `src/App.tsx`:

```tsx
<Route path="/projects" element={<ProjectsLandingPage />} />
<Route path="/projects/kitchens" element={<CategoryPage />} />
<Route path="/projects/full-house" element={<CategoryPage />} />
<Route path="/projects/bathroom" element={<CategoryPage />} />
<Route path="/projects/adu" element={<CategoryPage />} />
<Route path="/projects/fireplaces" element={<CategoryPage />} />
<Route path="/projects/kitchens/:slug" element={<ProjectPage />} />
<Route path="/projects/full-house/:slug" element={<ProjectPage />} />
<Route path="/projects/bathroom/:slug" element={<ProjectPage />} />
<Route path="/projects/adu/:slug" element={<ProjectPage />} />
<Route path="/projects/fireplaces/:slug" element={<ProjectPage />} />
```

Keep old portfolio routes as temporary redirects:

```tsx
<Route path="/kitchens" element={<Navigate to="/projects/kitchens" replace />} />
<Route path="/full-house-remodeling" element={<Navigate to="/projects/full-house" replace />} />
<Route path="/bathrooms" element={<Navigate to="/projects/bathroom" replace />} />
<Route path="/adu1" element={<Navigate to="/projects/adu" replace />} />
<Route path="/fireplaces" element={<Navigate to="/projects/fireplaces" replace />} />
```

- [ ] **Step 5: Re-run route verification**

Run:

```bash
node scripts/ui-homepage-check.mjs
```

Expected: PASS for `/`, `/projects`, `/projects/kitchens`, and `/blog`.

- [ ] **Step 6: Commit**

```bash
git add scripts/ui-homepage-check.mjs src/lib/portfolioRoutes.ts src/App.tsx
git commit -m "refactor: add canonical projects route tree"
```

## Task 2: Header Navigation Rebuild

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Header.module.scss`
- Reuse: `src/lib/portfolioRoutes.ts`
- Test: `scripts/ui-homepage-check.mjs`

- [ ] **Step 1: Extend browser verification with header markers**

Append to `scripts/ui-homepage-check.mjs`:

```js
await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

const header = page.locator('[data-site-header]').first();
const projectsTrigger = page.locator('[data-nav-projects]').first();
const blogLink = page.locator('a[href="/blog"]').first();

await header.waitFor();
await projectsTrigger.waitFor();
await blogLink.waitFor();
```

- [ ] **Step 2: Run the check before editing the header**

Run:

```bash
node scripts/ui-homepage-check.mjs
```

Expected: FAIL because the new header markers do not exist yet.

- [ ] **Step 3: Replace hardcoded nav definitions with the canonical route map**

Update `src/components/Header.tsx`:

```tsx
import { publicNavItems } from '../lib/portfolioRoutes';

type MenuItem = {
  label: string;
  href: string;
  sub?: { label: string; href: string }[];
};

const menuItems: MenuItem[] = publicNavItems.map((item) => ({
  label: item.label,
  href: item.href,
  sub: item.sub,
}));
```

Render `Projects` exactly like the existing dropdown pattern used for `Services` and `About`:

```tsx
<header className={`${styles.siteHeader} ${scrolled ? styles.scrolled : ''}`} data-site-header>
  ...
  {menuItems.map((item) => (
    <div
      key={item.label}
      className={styles.navItemWrap}
      data-nav-projects={item.label === 'Projects' ? 'true' : undefined}
    >
```

- [ ] **Step 4: Tighten desktop header layout around the new shorter IA**

Update `src/components/Header.module.scss`:

```scss
.desktopNav {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.navLink {
  min-height: var(--header-offset);
  display: inline-flex;
  align-items: center;
  padding: 0 clamp(10px, 0.9vw, 16px);
  font-size: clamp(10px, 0.78vw, 12px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.submenu {
  min-width: 200px;
  border-radius: 18px;
  padding: 10px 0;
}
```

- [ ] **Step 5: Re-run browser verification and build**

Run:

```bash
node scripts/ui-homepage-check.mjs
npm run build
```

Expected: PASS; header shows `Projects` dropdown and a top-level `Blog` link.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx src/components/Header.module.scss scripts/ui-homepage-check.mjs
git commit -m "feat: rebuild public header navigation"
```

## Task 3: Homepage Draft Content And Section Skeleton

**Files:**
- Create: `src/content/homepageDraft.ts`
- Create: `src/components/home/HomeHero.tsx`
- Create: `src/components/home/HomeIntro.tsx`
- Create: `src/components/home/HomeServices.tsx`
- Create: `src/components/home/HomeProcess.tsx`
- Create: `src/components/home/HomeProjectsGateway.tsx`
- Create: `src/components/home/HomeTestimonials.tsx`
- Create: `src/components/home/HomeBlogPreview.tsx`
- Create: `src/components/home/HomeFinalCta.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/HomePage.module.scss`
- Test: `scripts/ui-homepage-check.mjs`

- [ ] **Step 1: Extend browser verification with homepage section markers**

Append to `scripts/ui-homepage-check.mjs`:

```js
await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

const requiredHomeMarkers = [
  '[data-home-hero]',
  '[data-home-intro]',
  '[data-home-services]',
  '[data-home-process]',
  '[data-home-projects]',
  '[data-home-testimonials]',
  '[data-home-blog]',
  '[data-home-cta]',
];

for (const selector of requiredHomeMarkers) {
  await page.locator(selector).first().waitFor();
}
```

- [ ] **Step 2: Run the browser check and confirm the homepage markers fail**

Run:

```bash
node scripts/ui-homepage-check.mjs
```

Expected: FAIL because the new homepage sections do not exist.

- [ ] **Step 3: Create the temporary homepage content source**

Create `src/content/homepageDraft.ts`:

```ts
export const homepageDraft = {
  hero: {
    eyebrow: 'Alexandra Diz Interior Design',
    title: 'Designing interiors that feel as good as they look',
    text: 'Alexandra Diz creates refined California interiors that balance beauty, function, and clear remodeling decisions.',
    primaryCta: { label: 'View projects', href: '/projects' },
    secondaryCta: { label: 'Book consultation', href: '/contact' },
    videoPoster: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
    videoSrc: '',
  },
  intro: {
    title: 'A personal approach to interiors that work in real life',
    text: 'Alexandra guides each project from concept to clarity, helping clients shape interiors that feel elegant, practical, and deeply considered.',
    portraitPrimary: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80',
    portraitSecondary: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  },
  services: [
    { title: 'Interior architecture', text: 'Thoughtful space planning, spatial rhythm, and material clarity.' },
    { title: 'Kitchen remodeling', text: 'Layouts, finishes, and detailing built around daily life.' },
    { title: 'Bathroom design', text: 'Calm, tactile spaces that feel elevated and easy to use.' },
    { title: 'Full-home transformation', text: 'A cohesive design direction across the entire home.' },
  ],
  process: ['Plan', 'Refine', 'Build', 'Reveal'],
  testimonials: [
    { quote: 'Alexandra brought structure, calm, and confidence to every decision.', author: 'Client from Palo Alto' },
    { quote: 'The result felt beautiful immediately, but also practical from day one.', author: 'Kitchen remodel client' },
    { quote: 'She understood both the mood we wanted and the way we actually live.', author: 'Full-home project client' },
  ],
  finalCta: {
    title: 'Ready to shape a home that feels considered from the start?',
    text: 'Start with a conversation about your space, your priorities, and the kind of interior you want to live with every day.',
  },
} as const;
```

- [ ] **Step 4: Create the homepage section components with markers**

Each new component should render one top-level marker:

```tsx
export default function HomeHero() {
  return <section data-home-hero>...</section>;
}
```

```tsx
export default function HomeIntro() {
  return <section data-home-intro>...</section>;
}
```

```tsx
export default function HomeServices() {
  return <section data-home-services>...</section>;
}
```

```tsx
export default function HomeProcess() {
  return <section data-home-process>...</section>;
}
```

```tsx
export default function HomeProjectsGateway() {
  return <section data-home-projects>...</section>;
}
```

```tsx
export default function HomeTestimonials() {
  return <section data-home-testimonials>...</section>;
}
```

```tsx
export default function HomeBlogPreview() {
  return <section data-home-blog>...</section>;
}
```

```tsx
export default function HomeFinalCta() {
  return <section data-home-cta>...</section>;
}
```

- [ ] **Step 5: Recompose `HomePage.tsx` around those sections**

Replace the old category-led homepage loop in `src/pages/HomePage.tsx` with:

```tsx
import HomeHero from '../components/home/HomeHero';
import HomeIntro from '../components/home/HomeIntro';
import HomeServices from '../components/home/HomeServices';
import HomeProcess from '../components/home/HomeProcess';
import HomeProjectsGateway from '../components/home/HomeProjectsGateway';
import HomeTestimonials from '../components/home/HomeTestimonials';
import HomeBlogPreview from '../components/home/HomeBlogPreview';
import HomeFinalCta from '../components/home/HomeFinalCta';

export default function HomePage() {
  const { projects, blogPosts } = useAppStore();

  return (
    <>
      <Helmet>
        <title>Alexandra Diz — Interior Design Studio</title>
      </Helmet>
      <main className={styles.page}>
        <HomeHero />
        <HomeIntro />
        <HomeServices />
        <HomeProcess />
        <HomeProjectsGateway projects={projects} />
        <HomeTestimonials />
        <HomeBlogPreview posts={blogPosts} />
        <HomeFinalCta />
      </main>
    </>
  );
}
```

- [ ] **Step 6: Add page-level spacing only**

In `src/pages/HomePage.module.scss`:

```scss
.page {
  display: grid;
  gap: clamp(56px, 8vw, 120px);
  padding-bottom: clamp(56px, 8vw, 120px);
}
```

- [ ] **Step 7: Re-run browser verification**

Run:

```bash
node scripts/ui-homepage-check.mjs
```

Expected: PASS; all new homepage section markers are present.

- [ ] **Step 8: Commit**

```bash
git add src/content/homepageDraft.ts src/components/home src/pages/HomePage.tsx src/pages/HomePage.module.scss scripts/ui-homepage-check.mjs
git commit -m "feat: scaffold personal-brand homepage sections"
```

## Task 4: Cinematic Hero And Alexandra Introduction

**Files:**
- Modify: `src/components/home/HomeHero.tsx`
- Create: `src/components/home/HomeHero.module.scss`
- Modify: `src/components/home/HomeIntro.tsx`
- Create: `src/components/home/HomeIntro.module.scss`
- Reuse: `src/content/homepageDraft.ts`
- Test: `scripts/ui-homepage-check.mjs`

- [ ] **Step 1: Extend browser verification with CTA and media assertions**

Add to `scripts/ui-homepage-check.mjs`:

```js
const heroTitle = page.locator('[data-home-hero] h1').first();
const heroProjectsCta = page.locator('[data-home-hero] a[href="/projects"]').first();
const introMedia = page.locator('[data-home-intro] img').first();

await heroTitle.waitFor();
await heroProjectsCta.waitFor();
await introMedia.waitFor();
```

- [ ] **Step 2: Run the check before styling**

Run:

```bash
node scripts/ui-homepage-check.mjs
```

Expected: FAIL because the current scaffold does not yet render the required hero and intro media structure.

- [ ] **Step 3: Build the cinematic hero with video fallback**

Update `src/components/home/HomeHero.tsx`:

```tsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { homepageDraft } from '../../content/homepageDraft';
import styles from './HomeHero.module.scss';

export default function HomeHero() {
  const { hero } = homepageDraft;

  return (
    <section className={styles.hero} data-home-hero>
      <div className={styles.mediaStage}>
        {hero.videoSrc ? (
          <video className={styles.video} autoPlay muted loop playsInline poster={hero.videoPoster}>
            <source src={hero.videoSrc} />
          </video>
        ) : (
          <img src={hero.videoPoster} alt="" className={styles.videoFallback} />
        )}
        <div className={styles.overlay} />
      </div>
      <div className="page-shell">
        <div className={`${styles.content} page-shell__portfolio`}>
          <motion.span className={styles.eyebrow} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {hero.eyebrow}
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            {hero.title}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            {hero.text}
          </motion.p>
          <motion.div className={styles.actions} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <Link to={hero.primaryCta.href} className={styles.primaryButton}>{hero.primaryCta.label}</Link>
            <Link to={hero.secondaryCta.href} className={styles.secondaryButton}>{hero.secondaryCta.label}</Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Style the hero so it feels cinematic, not like a slider**

Create `src/components/home/HomeHero.module.scss`:

```scss
.hero {
  position: relative;
  min-height: min(100svh, 980px);
  display: grid;
  align-items: end;
}

.mediaStage {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.video,
.videoFallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.04);
}

.overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(12, 12, 12, 0.18) 0%, rgba(12, 12, 12, 0.68) 100%),
    radial-gradient(circle at 70% 20%, rgba(255, 255, 255, 0.08), transparent 42%);
}

.content {
  position: relative;
  z-index: 1;
  padding-top: calc(var(--header-offset) + 56px);
  padding-bottom: clamp(42px, 8vw, 96px);
}
```

- [ ] **Step 5: Build the Alexandra intro as an editorial split layout**

Update `src/components/home/HomeIntro.tsx`:

```tsx
import { homepageDraft } from '../../content/homepageDraft';
import styles from './HomeIntro.module.scss';

export default function HomeIntro() {
  const { intro } = homepageDraft;

  return (
    <section className={styles.section} data-home-intro>
      <div className="page-shell">
        <div className={`${styles.layout} page-shell__portfolio`}>
          <div className={styles.copy}>
            <span className={styles.eyebrow}>About Alexandra</span>
            <h2>{intro.title}</h2>
            <p>{intro.text}</p>
          </div>
          <div className={styles.media}>
            <img src={intro.portraitPrimary} alt="Placeholder portrait for Alexandra Diz" className={styles.primary} />
            <img src={intro.portraitSecondary} alt="" className={styles.secondary} />
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Re-run browser verification and build**

Run:

```bash
node scripts/ui-homepage-check.mjs
npm run build
```

Expected: PASS; hero renders `h1`, projects CTA, and the intro renders portrait placeholders.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/HomeHero.tsx src/components/home/HomeHero.module.scss src/components/home/HomeIntro.tsx src/components/home/HomeIntro.module.scss scripts/ui-homepage-check.mjs
git commit -m "feat: add homepage hero and alexandra introduction"
```

## Task 5: Services, Process, Projects Gateway, Testimonials, Blog, Final CTA

**Files:**
- Modify: `src/components/home/HomeServices.tsx`
- Create: `src/components/home/HomeServices.module.scss`
- Modify: `src/components/home/HomeProcess.tsx`
- Create: `src/components/home/HomeProcess.module.scss`
- Modify: `src/components/home/HomeProjectsGateway.tsx`
- Create: `src/components/home/HomeProjectsGateway.module.scss`
- Modify: `src/components/home/HomeTestimonials.tsx`
- Create: `src/components/home/HomeTestimonials.module.scss`
- Modify: `src/components/home/HomeBlogPreview.tsx`
- Create: `src/components/home/HomeBlogPreview.module.scss`
- Modify: `src/components/home/HomeFinalCta.tsx`
- Create: `src/components/home/HomeFinalCta.module.scss`
- Reuse: `src/content/homepageDraft.ts`, `src/lib/portfolioRoutes.ts`
- Test: `scripts/ui-homepage-check.mjs`

- [ ] **Step 1: Extend verification with link assertions**

Add to `scripts/ui-homepage-check.mjs`:

```js
await page.locator('[data-home-projects] a[href="/projects"]').first().waitFor();
await page.locator('[data-home-blog] a[href="/blog"]').first().waitFor();
await page.locator('[data-home-cta] a[href="/contact"]').first().waitFor();
```

- [ ] **Step 2: Run the check before wiring the real content**

Run:

```bash
node scripts/ui-homepage-check.mjs
```

Expected: FAIL because the scaffold sections do not yet contain those links.

- [ ] **Step 3: Implement the services and process sections with restrained motion**

Update `src/components/home/HomeServices.tsx`:

```tsx
import { motion } from 'framer-motion';
import { homepageDraft } from '../../content/homepageDraft';
import styles from './HomeServices.module.scss';

export default function HomeServices() {
  return (
    <section className={styles.section} data-home-services>
      <div className="page-shell">
        <div className={`${styles.inner} page-shell__portfolio`}>
          {homepageDraft.services.map((item, index) => (
            <motion.article
              key={item.title}
              className={styles.card}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.06 }}
            >
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Update `src/components/home/HomeProcess.tsx`:

```tsx
import { homepageDraft } from '../../content/homepageDraft';
import styles from './HomeProcess.module.scss';

export default function HomeProcess() {
  return (
    <section className={styles.section} data-home-process>
      <div className="page-shell">
        <div className={`${styles.inner} page-shell__portfolio`}>
          {homepageDraft.process.map((step, index) => (
            <div key={step} className={styles.step}>
              <span className={styles.index}>0{index + 1}</span>
              <h3>{step}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Implement the projects gateway from featured project data**

Update `src/components/home/HomeProjectsGateway.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { getProjectHref } from '../../lib/portfolioRoutes';
import styles from './HomeProjectsGateway.module.scss';

export default function HomeProjectsGateway({ projects = [] }) {
  const featured = projects.filter((project) => project.isPublished).slice(0, 2);

  return (
    <section className={styles.section} data-home-projects>
      <div className="page-shell">
        <div className={`${styles.inner} page-shell__portfolio`}>
          <div className={styles.copy}>
            <span className={styles.eyebrow}>Selected work</span>
            <h2>Explore projects shaped around real spaces and real routines.</h2>
            <Link to="/projects" className={styles.cta}>View all projects</Link>
          </div>
          <div className={styles.grid}>
            {featured.map((project) => (
              <Link key={project.id} to={getProjectHref(project.categoryId, project.slug)} className={styles.card}>
                <span>{project.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Implement testimonials, blog preview, and final CTA**

Update `src/components/home/HomeTestimonials.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { homepageDraft } from '../../content/homepageDraft';
import styles from './HomeTestimonials.module.scss';

export default function HomeTestimonials() {
  const [index, setIndex] = useState(0);
  const items = homepageDraft.testimonials;

  useEffect(() => {
    const id = window.setInterval(() => setIndex((value) => (value + 1) % items.length), 7000);
    return () => window.clearInterval(id);
  }, [items.length]);

  const active = items[index];

  return (
    <section className={styles.section} data-home-testimonials>
      <div className="page-shell">
        <div className={`${styles.inner} page-shell__text`}>
          <blockquote>{active.quote}</blockquote>
          <p>{active.author}</p>
        </div>
      </div>
    </section>
  );
}
```

Update `src/components/home/HomeBlogPreview.tsx`:

```tsx
import { Link } from 'react-router-dom';
import styles from './HomeBlogPreview.module.scss';

export default function HomeBlogPreview({ posts = [] }) {
  const visiblePosts = posts.slice(0, 3);

  return (
    <section className={styles.section} data-home-blog>
      <div className="page-shell">
        <div className={`${styles.inner} page-shell__portfolio`}>
          <div className={styles.copy}>
            <span className={styles.eyebrow}>From the blog</span>
            <h2>Ideas, guidance, and design notes behind better interiors.</h2>
            <Link to="/blog" className={styles.cta}>Go to blog</Link>
          </div>
          <div className={styles.grid}>
            {visiblePosts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className={styles.card}>
                <h3>{post.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

Update `src/components/home/HomeFinalCta.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { homepageDraft } from '../../content/homepageDraft';
import styles from './HomeFinalCta.module.scss';

export default function HomeFinalCta() {
  return (
    <section className={styles.section} data-home-cta>
      <div className="page-shell">
        <div className={`${styles.inner} page-shell__text`}>
          <h2>{homepageDraft.finalCta.title}</h2>
          <p>{homepageDraft.finalCta.text}</p>
          <Link to="/contact" className={styles.cta}>Book consultation</Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Re-run browser verification, build, and smoke**

Run:

```bash
node scripts/ui-homepage-check.mjs
npm run build
npm run test:smoke
```

Expected: PASS; homepage sections render their CTAs, production build succeeds, smoke still passes.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/HomeServices.tsx src/components/home/HomeServices.module.scss src/components/home/HomeProcess.tsx src/components/home/HomeProcess.module.scss src/components/home/HomeProjectsGateway.tsx src/components/home/HomeProjectsGateway.module.scss src/components/home/HomeTestimonials.tsx src/components/home/HomeTestimonials.module.scss src/components/home/HomeBlogPreview.tsx src/components/home/HomeBlogPreview.module.scss src/components/home/HomeFinalCta.tsx src/components/home/HomeFinalCta.module.scss scripts/ui-homepage-check.mjs
git commit -m "feat: add homepage storytelling and conversion sections"
```

## Task 6: Projects Landing Page And Final Responsive Polish

**Files:**
- Modify: `src/pages/CategoryPage.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/styles/_layout.scss`
- Modify: `src/components/home/*.module.scss`
- Modify: `scripts/ui-homepage-check.mjs`

- [ ] **Step 1: Extend verification with mobile viewport assertions**

Update `scripts/ui-homepage-check.mjs`:

```js
const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobilePage.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
const heroBox = await mobilePage.locator('[data-home-hero]').first().boundingBox();
assert(heroBox && heroBox.width <= 390, 'Mobile hero overflows viewport');
await mobilePage.locator('[data-home-blog] a[href="/blog"]').first().waitFor();
await mobilePage.locator('[data-nav-projects]').first().waitFor();
```

- [ ] **Step 2: Run the mobile check before responsive polish**

Run:

```bash
node scripts/ui-homepage-check.mjs
```

Expected: FAIL if any homepage section or nav marker overflows or disappears on mobile.

- [ ] **Step 3: Create a simple `/projects` landing state inside `CategoryPage.tsx` or a dedicated page**

If using `CategoryPage.tsx`, add a `/projects` branch:

```tsx
if (pathname === '/projects') {
  return (
    <main className={styles.page}>
      <div className="page-shell">
        <div className={`${styles.projectsLanding} page-shell__portfolio`}>
          {projectCategoryRoutes.map((category) => (
            <Link key={category.href} to={category.href} className={styles.categoryCard}>
              <h2>{category.label}</h2>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Tighten responsive styles across homepage sections**

Apply the same responsive intent across the section modules:

```scss
@media (max-width: 900px) {
  .layout,
  .inner,
  .grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
```

And in `src/styles/_layout.scss` ensure containers remain wide but safe:

```scss
.page-shell {
  width: 100%;
  padding-inline: var(--page-gutter);
}

.page-shell__portfolio {
  width: min(100%, var(--portfolio-max-width));
  margin: 0 auto;
}
```

- [ ] **Step 5: Re-run all verification**

Run:

```bash
node scripts/ui-homepage-check.mjs
npm run build
npm run test:smoke
```

Expected: PASS in desktop and mobile viewport checks, build succeeds, smoke passes.

- [ ] **Step 6: Commit**

```bash
git add src/pages/CategoryPage.tsx src/pages/HomePage.tsx src/styles/_layout.scss src/components/home scripts/ui-homepage-check.mjs
git commit -m "feat: finalize homepage and projects landing responsiveness"
```

## Self-Review

### Spec coverage

- top-level nav with `Home`, `Projects`, `Blog`, `Video`, `Services`, `About`, `Contact`: covered by Task 2
- `/projects/...` SEO-friendly hierarchy: covered by Task 1
- homepage centered on Alexandra instead of category archive: covered by Tasks 3 and 4
- hero with background video and strong `h1`: covered by Task 4
- placeholder personal photography: covered by Task 4
- service/value explanation: covered by Task 5
- process story section: covered by Task 5
- explicit projects CTA block: covered by Task 5
- testimonials slider with text + author: covered by Task 5
- blog mention + CTA on homepage: covered by Task 5
- final CTA/contact entry: covered by Task 5
- responsive polish: covered by Task 6

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain.
- Every code-editing task includes explicit target files and code snippets.
- Every verification step includes exact commands and expected outcomes.

### Type consistency

- Route helpers consistently use:
  - `projectCategoryRoutes`
  - `publicNavItems`
  - `getProjectCategoryHref`
  - `getProjectHref`
- Homepage section markers stay consistent:
  - `[data-home-hero]`
  - `[data-home-intro]`
  - `[data-home-services]`
  - `[data-home-process]`
  - `[data-home-projects]`
  - `[data-home-testimonials]`
  - `[data-home-blog]`
  - `[data-home-cta]`
- Header marker remains `[data-nav-projects]`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-24-homepage-personal-brand-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
