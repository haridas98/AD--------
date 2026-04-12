# 🗺️ Incremental Development Roadmap: Alexandra Diz Migration

> **Purpose:** Step-by-step execution plan designed for AI-assisted development.  
> **Core Rule:** Complete one phase fully, verify acceptance criteria, then move to the next. Never prompt multiple phases at once.

---

## 📖 How to Use This Roadmap with AI

1. **Copy only the current phase** into your AI prompt.
2. **Include this rule at the top:**  
   `⚠️ SCOPE LIMIT: Implement ONLY the tasks listed in this phase. Do not write code for future phases. Use mock data where backend is not ready. Ask clarifying questions before generating large files.`
3. **Verify** using the `✅ Acceptance Criteria` and `🔒 Phase Gate` before proceeding.
4. **Commit changes** after each phase to maintain a clean Git history.

---

## 🟢 Phase 0: Repository Setup & Baseline Recovery
**🎯 Objective:** Initialize project structure, restore Codex's partial work, and ensure a clean, buildable baseline.

### 🛠️ Tasks
- Create monorepo or `/client` + `/server` structure
- Install core dependencies: `react`, `typescript`, `vite` (or `next`), `node`, `express`, `zustand`, `react-router-dom`, `framer-motion`, `eslint`, `prettier`
- Restore and merge Codex's existing React + Node code
- Fix TypeScript errors, resolve dependency conflicts
- Configure `.env.local` (client) and `.env` (server) templates
- Set up basic dev scripts: `dev`, `build`, `lint`

### ✅ Acceptance Criteria
- `npm run dev` starts both client (Vite) and server (Express) without errors
- Codex's partial components compile successfully
- Git repository initialized with `.gitignore` for `node_modules`, `.env`, `dist`

### 🤖 AI Prompt Strategy
> `Set up the project structure for a React 18 + TypeScript frontend and Node.js + Express backend. Restore the existing code I have from a previous AI migration. Fix all build errors, configure TypeScript, ESLint, and Prettier. Do not add new features. Only make the codebase compile and run locally.`

### 🔒 Phase Gate
✅ Both client and server run locally without console errors.  
✅ `git commit -m "Phase 0: Project setup & baseline recovery"`

---

## 🔵 Phase 1: Frontend Layout & Static Page Migration
**🎯 Objective:** Convert Vigbo HTML/CSS to React components, preserve design exactly, fix critical contrast issues.

### 🛠️ Tasks
- Convert 2 global CSS files to CSS Variables + CSS Modules
- Create `Layout`, `Header`, `Footer` components
- Migrate pages one-by-one: `Home` → `About` → `Contact` → `Services`
- Replace all local image paths with live Vigbo/CDN URLs
- Fix black text on dark backgrounds (contrast ≥ 4.5:1)
- Implement mobile hamburger menu + responsive breakpoints

### ✅ Acceptance Criteria
- Pixel-perfect visual match to original Vigbo site
- All text readable on dark backgrounds
- Navigation works on mobile/tablet/desktop
- No console errors or missing assets

### 🤖 AI Prompt Strategy
> `Convert the provided HTML pages into React components using CSS Modules. Preserve the exact layout, typography, and spacing. Fix any black text on dark backgrounds. Implement a responsive mobile menu. Do not connect to any backend yet. Work on one page at a time.`

### 🔒 Phase Gate
✅ All static pages render identically to Vigbo version.  
✅ Lighthouse Accessibility score ≥ 90.  
✅ `git commit -m "Phase 1: Static page migration & contrast fixes"`

---

## 🟡 Phase 2: Project Data Layer & Dynamic Gallery
**🎯 Objective:** Build the project display system, connect to mock API, implement routing & lightbox.

### 🛠️ Tasks
- Define `Project` TypeScript interface
- Create `ProjectCard`, `ProjectGrid`, `ProjectDetail` components
- Set up React Router: `/projects`, `/projects/:slug`
- Implement mock data fetcher + Zustand store
- Build lightbox with keyboard navigation (← → Esc)
- Add skeleton loaders & error boundaries

### ✅ Acceptance Criteria
- Gallery filters by category
- Clicking a project navigates to detail page
- Lightbox opens/closes smoothly, supports keyboard
- Layout remains stable during image loading (CLS < 0.1)

### 🤖 AI Prompt Strategy
> `Create a dynamic project gallery using mock JSON data. Build ProjectCard, Grid, and Detail page components. Implement routing and a simple lightbox with keyboard support. Use Zustand for state. Do not build the admin panel or backend endpoints yet. Focus only on reading and displaying data.`

### 🔒 Phase Gate
✅ All projects load from mock data, routes work, lightbox is functional.  
✅ No layout shift on image load.  
✅ `git commit -m "Phase 2: Project gallery & routing"`

---

## 🟠 Phase 3: Admin Panel & CRUD Operations
**🎯 Objective:** Build secure admin interface, implement project management, match public site design.

### 🛠️ Tasks
- Implement JWT auth: `/admin/login`, protected routes, session timeout
- Reuse public UI components (buttons, inputs, cards) with admin variants
- Build Project Form: title, slug, category, location, rich text (Tiptap), image URL inputs, `isPublished` toggle
- Create Express endpoints: `GET/POST/PUT/DELETE /api/projects`
- Connect form to backend with validation & draft autosave
- Add drag-and-drop reordering for homepage featured section

### ✅ Acceptance Criteria
- Login/logout works securely
- Admin can create, edit, delete, and publish projects
- Changes reflect on public site after refresh
- Form prevents invalid submissions

### 🤖 AI Prompt Strategy
> `Build the admin panel using the same design system as the public site. Implement JWT authentication and protected routes. Create a project CRUD form with validation, rich text, and image URL inputs. Connect to Express endpoints. Do not touch blog or SEO yet. Focus only on project management.`

### 🔒 Phase Gate
✅ Full CRUD works end-to-end with test database.  
✅ Admin UI feels consistent with public site.  
✅ `git commit -m "Phase 3: Admin panel & project CRUD"`

---

## 🟣 Phase 4: UX Polish, Animations & Performance
**🎯 Objective:** Implement smooth animations, optimize responsiveness, ensure performance targets.

### 🛠️ Tasks
- Add Framer Motion to page transitions, hover states, gallery stagger
- Implement `prefers-reduced-motion` respect
- Optimize images: `loading="lazy"`, blur-up placeholders, `srcset`
- Fix remaining responsive breakpoints (test on 320px → 1440px)
- Run Lighthouse audit, fix Performance/SEO/Accessibility scores < 90
- Add `ErrorBoundary` wrappers for critical sections

### ✅ Acceptance Criteria
- Animations feel smooth, not distracting
- Lighthouse Performance ≥ 90, Accessibility ≥ 95
- No layout shift, fast FCP/TTI
- Works flawlessly on iOS Safari & Chrome Android

### 🤖 AI Prompt Strategy
> `Add Framer Motion animations to existing components: staggered gallery loads, hover lifts, page transitions. Optimize image loading with lazy + placeholders. Fix any remaining responsive issues. Respect prefers-reduced-motion. Do not change business logic or add new features.`

### 🔒 Phase Gate
✅ All animations performant & accessible.  
✅ Lighthouse scores meet targets.  
✅ `git commit -m "Phase 4: Animations, responsiveness & performance"`

---

## 🔴 Phase 5: SEO Foundation & Content Optimization
**🎯 Objective:** Implement technical SEO, structured data, dynamic meta tags, sitemap.

### 🛠️ Tasks
- Integrate `react-helmet-async`
- Generate dynamic `<title>`, `<meta description>`, Open Graph, Twitter cards per route
- Add JSON-LD: `ProfessionalService`, `BreadcrumbList`, `ImageObject`
- Auto-generate `/sitemap.xml` and `/robots.txt`
- Populate descriptive `alt` text for all project images from metadata
- Validate with Rich Results Test & Lighthouse SEO tab

### ✅ Acceptance Criteria
- Every page has unique, optimized meta tags
- Structured data passes Google validation
- Sitemap includes all public routes
- No SEO warnings in Lighthouse

### 🤖 AI Prompt Strategy
> `Implement SEO infrastructure using react-helmet-async. Add dynamic meta tags, Open Graph, Twitter cards, and JSON-LD structured data to all routes. Generate sitemap.xml and robots.txt. Ensure all images have descriptive alt text from project metadata. Do not build blog or analytics yet.`

### 🔒 Phase Gate
✅ Rich Results Test passes.  
✅ Lighthouse SEO score ≥ 95.  
✅ `git commit -m "Phase 5: SEO foundation & structured data"`

---

## ⚫ Phase 6: Future-Proofing & Deployment Prep
**🎯 Objective:** Prepare blog architecture, set up CI/CD, document handoff.

### 🛠️ Tasks
- Create `/blog` route + listing/detail stubs (hidden via `VITE_FEATURE_BLOG_ENABLED=false`)
- Define `BlogPost` interface in shared types
- Add "Add Article" stub in admin panel (UI only, no backend)
- Configure Vercel (frontend) + Render/Railway (backend) deployment
- Write `README.md`, `ADMIN_GUIDE.md`, `DEPLOYMENT.md`
- Run Playwright E2E smoke test: login → create project → view on public site

### ✅ Acceptance Criteria
- Blog routes exist but are disabled by flag
- Deployment configs ready for one-click push
- Documentation clear for client & future developers
- E2E test passes critical user flows

### 🤖 AI Prompt Strategy
> `Prepare the codebase for production deployment. Add hidden blog routes controlled by a feature flag. Create admin stubs for future articles. Set up Vercel and Render deployment configs. Write clear documentation for setup, admin usage, and deployment. Do not implement full blog functionality yet.`

### 🔒 Phase Gate
✅ `npm run build` succeeds with zero warnings.  
✅ Deployment configs tested in preview mode.  
✅ Documentation complete.  
✅ `git commit -m "Phase 6: Blog prep, deployment & docs"`

---

## 📌 AI Workflow Rules (Keep in Every Prompt)

1. **Scope Lock:** `Implement ONLY this phase. Ignore all future features.`
2. **Mock First:** `Use mock data until backend is explicitly requested.`
3. **Component Reuse:** `Reuse existing UI components. Do not duplicate styles.`
4. **Test Before Commit:** `Run lint, type-check, and dev server before outputting code.`
5. **Ask, Don't Guess:** `If requirements are ambiguous, ask for clarification instead of assuming.`

---

> 💡 **Pro Tip:** Save this file as `ROADMAP.md` in your project root. Reference it in every AI session:  
> `📖 Follow ROADMAP.md strictly. I am currently on Phase X. Do not proceed beyond this phase.`

*End of Roadmap* 🏗️✨