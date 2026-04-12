# Project Specification: Alexandra Diz Portfolio Migration to React

> **Document Version:** 1.0  
> **Last Updated:** April 2026  
> **Project Type:** Frontend Migration + Admin Panel Development  
> **Target Stack:** React 18+, Node.js, Modern Web Technologies

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Current State Analysis](#-current-state-analysis)
3. [Technical Requirements](#-technical-requirements)
4. [Design & UX Guidelines](#-design--ux-guidelines)
5. [Feature Specifications](#-feature-specifications)
6. [Admin Panel Requirements](#-admin-panel-requirements)
7. [SEO & Performance](#-seo--performance)
8. [Future-Proofing: Blog Module](#-future-proofing-blog-module)
9. [Development Workflow](#-development-workflow)
10. [Deliverables & Acceptance Criteria](#-deliverables--acceptance-criteria)
11. [Appendix: Asset Inventory](#-appendix-asset-inventory)

---

## 🎯 Project Overview

### Objective
Migrate the existing portfolio website [alexandradiz.com](https://alexandradiz.com/) from Vigbo platform to a modern React-based application while preserving the approved visual design and enhancing functionality, performance, and maintainability.

### Business Context
- **Client:** Alexandra Diz — Interior Design & Real Estate Professional
- **Primary Goal:** Showcase interior/exterior design projects with high-quality imagery
- **Secondary Goals:** 
  - Enable self-service content management via admin panel
  - Improve SEO visibility for local real estate/design keywords
  - Prepare infrastructure for future blog/content marketing

### Key Constraints
- ⚠️ **Design Preservation:** No critical visual changes to approved layout, typography, or color scheme
- ⚠️ **Content Continuity:** All existing project images must remain accessible via current URLs during transition
- ⚠️ **Zero Downtime:** Migration must not disrupt live site availability

---

## 🔍 Current State Analysis

### Source Assets (Provided)
```
/project-assets
├── /html-pages/          # All exported .html files from Vigbo
│   ├── index.html
│   ├── projects.html
│   ├── kitchens.html
│   ├── bathrooms.html
│   ├── about.html
│   ├── contact.html
│   └── ...
├── /css/
│   ├── global-styles.css # Primary global stylesheet
│   └── vigbo-framework.css # Vigbo-specific utilities
└── /assets/              # Local references (to be replaced with CDN URLs)
```

### Existing Site Structure
```
Navigation:
├── Projects (Landing)
│   ├── Kitchens
│   ├── Full House Remodeling
│   ├── Bathroom
│   ├── ADU (Accessory Dwelling Units)
│   ├── Projects Before & After
│   ├── Video Series
│   └── Fireplaces
├── Services
│   ├── Full Service Interior Design
│   ├── Bathroom Remodeling
│   └── Kitchen Remodeling
├── About Me
│   ├── Press / Media
│   ├── Testimonials
│   └── About Me (Bio)
├── Contact
└── [FUTURE] Blog ← New section
```

### Previous Migration Work (Codex AI)
- ✅ Partial React component structure initiated
- ✅ Basic Node.js/Express admin backend scaffolded
- ✅ Project CRUD operations partially implemented
- ❌ Incomplete: authentication, image upload, rich text editor, responsive adaptations
- ❌ Stopped due to API limits — **this project continues from this baseline**

---

## ⚙️ Technical Requirements

### Core Stack
| Layer | Technology | Justification |
|-------|-----------|--------------|
| **Frontend** | React 18 + TypeScript | Type safety, component reusability, modern hooks |
| **State Management** | Zustand or Jotai | Lightweight, scalable for portfolio + admin state |
| **Routing** | React Router v6 + Lazy Loading | Code splitting, SEO-friendly URLs |
| **Styling** | CSS Modules + PostCSS + Autoprefixer | Scoped styles, maintainability, Vigbo CSS migration path |
| **Animations** | Framer Motion | Declarative, performant, accessible animations |
| **Backend** | Node.js + Express + TypeScript | Unified language, easy integration with React |
| **Database** | MongoDB Atlas (or PostgreSQL) | Flexible schema for projects/blog, cloud-managed |
| **Auth** | JWT + Refresh Tokens + bcrypt | Secure, stateless admin authentication |
| **Image Handling** | Cloudinary or Imgix (via CDN URLs) | Optimized delivery, lazy loading, responsive formats |
| **SEO** | React Helmet Async + SSR/SSG consideration | Dynamic meta tags, Open Graph, structured data |
| **Testing** | Vitest + React Testing Library + Playwright | Unit, component, and E2E coverage |
| **Deployment** | Vercel (Frontend) + Render/Railway (Backend) | Zero-config CI/CD, preview deployments |

### Performance Targets
- ⚡ Lighthouse Performance Score: ≥ 90 (Mobile & Desktop)
- ⚡ First Contentful Paint: < 1.5s on 3G
- ⚡ Time to Interactive: < 3.5s on mid-tier mobile
- ⚡ Bundle Size: < 250KB initial JS (gzipped), code-split per route

### Accessibility & Compliance
- WCAG 2.1 AA compliance for all interactive elements
- Semantic HTML structure with ARIA labels where needed
- Keyboard navigation support for gallery/carousel components
- Color contrast fixes (see [Design Fixes](#-critical-design-fixes))

---

## 🎨 Design & UX Guidelines

### Visual Fidelity Requirements
- ✅ **Preserve exactly:** Layout grids, typography hierarchy (font families, weights, sizes), spacing system, button styles, hover states
- ✅ **Reuse:** All existing image URLs directly in `<img>` or `<picture>` tags (no local hosting initially)
- ✅ **Match:** Transition animations, scroll behaviors, and micro-interactions from Vigbo site

### 🔧 Critical Design Fixes (Priority 1)
| Issue | Location | Solution |
|-------|----------|----------|
| Black text on black background | Project detail pages, dark sections | Change text color to `#f5f5f5` or `#ffffff` with `text-shadow: 0 1px 2px rgba(0,0,0,0.3)` for readability |
| Low-contrast links in footer | Global footer | Update link color to `#cccccc` → `#e0e0e0` with `:hover` state `#ffffff` |
| Image alt attributes missing | All project galleries | Add descriptive `alt` text dynamically from project metadata |
| Non-responsive image containers | Project grid cards | Implement `object-fit: cover` + `aspect-ratio` CSS + `srcset` for responsiveness |

### Animation Guidelines
```tsx
// Example: Smooth project card hover (Framer Motion)
<motion.div
  whileHover={{ y: -4, transition: { duration: 0.2 } }}
  whileTap={{ scale: 0.99 }}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
  {/* Project Card Content */}
</motion.div>
```
- Use `prefers-reduced-motion` media query to respect user settings
- Animate only transform/opacity properties for GPU acceleration
- Stagger animations in lists (galleries, project grids) for polished feel

### Responsive Breakpoints
```css
/* Mobile-first approach */
$breakpoints: (
  'sm': 640px,   // Phones
  'md': 768px,   // Tablets
  'lg': 1024px,  // Small laptops
  'xl': 1280px,  // Desktops
  '2xl': 1536px  // Large screens
);
```
- Test on: iPhone SE → iPhone 15 Pro Max, iPad Air, MacBook Pro 13"/16", 4K desktop

---

## ✨ Feature Specifications

### Public-Facing Features

#### 1. Dynamic Project Gallery
- Grid layout with filter by category (Kitchens, Bathrooms, ADU, etc.)
- Lightbox modal with keyboard navigation (← → Esc)
- "Before/After" toggle slider for comparison projects
- Lazy-loaded images with blur-up placeholder

#### 2. Project Detail Page
- Hero image carousel (if multiple images)
- Structured content: location, scope, materials, timeline
- "Related Projects" section (same category)
- Social share buttons (Pinterest-optimized for design audience)

#### 3. Services Section
- Accordion/toggle for service details
- Clear CTA: "Schedule Consultation" linking to Contact
- Iconography consistent with brand (SVG sprites)

#### 4. Contact Form
- Form validation (client-side + server-side)
- Integration with email service (Resend or SendGrid)
- Spam protection: hCaptcha or Cloudflare Turnstile
- Success state with animation + optional calendar embed (Cal.com)

#### 5. Global Components
- **Header:** Sticky navigation with mobile hamburger menu (animated)
- **Footer:** Copyright, social links, contact info, sitemap links
- **Loading States:** Skeleton screens for project grids
- **404 Page:** Branded, with link back to Projects

---

## 👨‍💼 Admin Panel Requirements

### Core Philosophy
> *"The admin experience should feel like a natural extension of the public site — same visual language, intuitive workflow, zero training needed."*

### Design System Alignment
- Reuse React components from public site (Buttons, Cards, Inputs) with admin-specific variants
- Same color palette, typography, spacing tokens
- Dark mode optional (but not required — match site's light/dark sections)

### Admin Features (MVP)

#### 🔐 Authentication
- Login page with email/password
- JWT token storage (httpOnly cookie)
- Session timeout after 30min inactivity
- Password reset flow (email link)

#### 🗂️ Project Management
| Action | UI Component | Backend Endpoint |
|--------|-------------|-----------------|
| View all projects | Paginated table + grid toggle | `GET /api/projects` |
| Create new project | Form with rich text editor (Tiptap) + image URL inputs | `POST /api/projects` |
| Edit project | Pre-filled form + draft autosave | `PUT /api/projects/:id` |
| Delete project | Confirmation modal + soft delete | `DELETE /api/projects/:id` |
| Reorder projects | Drag-and-drop (dnd-kit) for homepage featured section | `PATCH /api/projects/reorder` |

#### 📝 Project Form Fields
```ts
interface Project {
  id: string;
  title: string;                // e.g., "Sunny House, Redwood City"
  slug: string;                 // auto-generated, editable
  category: 'kitchen' | 'bathroom' | 'full-house' | 'adu' | 'fireplace' | 'commercial';
  location: string;             // e.g., "Redwood City, San Francisco Bay area"
  description: string;          // Rich text (HTML)
  images: Array<{
    url: string;                // CDN URL (required)
    alt: string;                // SEO/accessibility
    isHero?: boolean;           // Flag for primary image
  }>;
  isFeatured: boolean;          // Show on homepage carousel
  isPublished: boolean;         // Draft/publish toggle
  seoTitle?: string;            // Override default
  seoDescription?: string;      // Override default
  createdAt: Date;
  updatedAt: Date;
}
```

#### 🎨 Image Handling Strategy (Phase 1)
- **Input:** Admin enters image URLs (as currently used on Vigbo site)
- **Validation:** Check URL format + optional HEAD request for 200 status
- **Preview:** Show thumbnail in admin form before saving
- **Future Phase:** Integrate Cloudinary widget for direct upload + optimization

#### 📊 Dashboard (Optional but Recommended)
- Quick stats: Total projects, Published vs Draft, Recent activity
- "Quick Add" button for new projects
- Link to public site preview

---

## 🔍 SEO & Performance

### Technical SEO Implementation
- ✅ Dynamic `<title>` and `<meta name="description">` per page via React Helmet
- ✅ Open Graph + Twitter Card tags for social sharing
- ✅ JSON-LD structured data:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Alexandra Diz Design",
    "image": "https://alexandradiz.com/logo.jpg",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "CA",
      "addressCountry": "US"
    },
    "priceRange": "$$$"
  }
  ```
- ✅ Semantic HTML5: `<article>`, `<section>`, proper heading hierarchy
- ✅ XML sitemap generator (`/sitemap.xml`) + robots.txt
- ✅ Canonical URLs to prevent duplicate content

### Content SEO Strategy
- Keyword-optimized project titles/descriptions (client to provide terms)
- Location-based metadata: "Interior Designer in [City]", "Kitchen Remodel [Bay Area]"
- Image `alt` attributes: `"Modern kitchen remodel in Redwood City by Alexandra Diz"`
- Blog-ready URL structure: `/blog/[slug]` (reserved)

### Performance Optimizations
- Code splitting by route + component lazy loading
- Image lazy loading with `loading="lazy"` + Intersection Observer fallback
- Preconnect to image CDN domains
- Critical CSS inlined for above-fold content
- Cache strategies: 
  - Static assets: `Cache-Control: public, max-age=31536000`
  - API responses: `stale-while-revalidate`

---

## 🚀 Future-Proofing: Blog Module

### Phase 2 Roadmap (Post-MVP)
```mermaid
graph LR
  A[Blog Architecture] --> B[Admin: Article CRUD]
  A --> C[Public: /blog Listing + /blog/[slug]]
  A --> D[Rich Text Editor with Image Embed]
  A --> E[Categories/Tags + Search]
  A --> F[Newsletter Signup Integration]
```

### Header Update (Ready for Blog)
```tsx
// Navigation item - hidden until blog content exists
{
  label: 'Blog',
  path: '/blog',
  hidden: !featureFlags.blogEnabled // Feature flag controlled via env/admin
}
```

### Blog Data Model (Predefined)
```ts
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;          // For listing cards
  content: string;          // Rich HTML from editor
  coverImage: { url: string; alt: string };
  author: 'Alexandra Diz';  // Extensible later
  publishedAt: Date;
  categories: Array<'design-tips' | 'project-stories' | 'trends'>;
  seo: { title?: string; description?: string; keywords?: string[] };
  isPublished: boolean;
}
```

### SEO Synergy
- Blog content targets long-tail keywords: "how to choose kitchen cabinets Bay Area"
- Internal linking: Blog posts → relevant project pages
- RSS feed generation for content aggregators

---

## 🛠️ Development Workflow

### Repository Structure
```
/alexandradiz-react
├── /client                 # React frontend
│   ├── /src
│   │   ├── /components     # Reusable UI (Button, Card, Modal)
│   │   ├── /features       # Domain-specific (ProjectGallery, AdminPanel)
│   │   ├── /hooks          # Custom hooks (useProjects, useAuth)
│   │   ├── /lib            # Utilities (api client, analytics)
│   │   ├── /pages          # Route components (Next.js-style)
│   │   ├── /styles         # Global CSS, CSS Modules, tokens
│   │   └── /types          # TypeScript interfaces
│   ├── vite.config.ts      # Or next.config.js if SSR adopted
│   └── package.json
├── /server                 # Node.js backend
│   ├── /src
│   │   ├── /controllers    # Route handlers
│   │   ├── /models         # Mongoose/Prisma schemas
│   │   ├── /middleware     # Auth, validation, error handling
│   │   ├── /routes         # Express routers
│   │   └── /utils          # Helpers (image validation, SEO utils)
│   ├── package.json
│   └── tsconfig.json
├── /shared                 # Types/utils used by both client & server
├── docker-compose.yml      # Local dev: MongoDB + app services
├── .github/workflows/      # CI: test, build, deploy previews
└── README.md               # Setup instructions, env vars guide
```

### Environment Variables Template
```env
# Client (.env.local)
VITE_API_BASE_URL=https://api.alexandradiz.com
VITE_CDN_BASE_URL=https://res.cloudinary.com/...
VITE_FEATURE_BLOG_ENABLED=false

# Server (.env)
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_strong_secret_here
RESEND_API_KEY=re_...
CLOUDINARY_CLOUD_NAME=... # Future phase
```

### Quality Assurance Checklist
- [ ] All interactive elements keyboard-accessible
- [ ] Color contrast ratio ≥ 4.5:1 for body text (verified via axe-core)
- [ ] No layout shift (CLS < 0.1) on image loads
- [ ] Admin forms prevent accidental data loss (beforeunload handler)
- [ ] Error boundaries wrap major sections (graceful degradation)
- [ ] Console errors/warnings eliminated in production build

---

## ✅ Deliverables & Acceptance Criteria

### MVP Launch (Phase 1)
| Deliverable | Acceptance Criteria |
|-------------|---------------------|
| **React Public Site** | - Pixel-perfect match to Vigbo design (visual regression tests) <br> - All navigation links functional <br> - Mobile-responsive down to 320px width <br> - Lighthouse SEO score ≥ 95 |
| **Admin Panel** | - Secure login/logout flow <br> - CRUD operations for projects work end-to-end <br> - Changes reflect on public site within 60s (or manual refresh) <br> - Form validation prevents bad data |
| **Content Migration** | - All 50+ existing projects imported with metadata <br> - Image URLs validated and displaying correctly <br> - No broken links or 404s on migrated pages |
| **SEO Foundation** | - Dynamic meta tags per page <br> - XML sitemap generated and submitted to Google Search Console <br> - Structured data validated via Rich Results Test |
| **Documentation** | - `README.md` with local setup steps <br> - `ADMIN_GUIDE.md` with screenshots for client <br> - `DEPLOYMENT.md` for DevOps handoff |

### Post-Launch (Phase 2)
- [ ] Blog module implemented and enabled via feature flag
- [ ] Image upload integration (Cloudinary) replacing manual URL entry
- [ ] Analytics dashboard (basic traffic/project views)
- [ ] Client training session recorded + written FAQ

---

## 📎 Appendix: Asset Inventory

### Critical Image Categories (URL Patterns)
```
# Example existing URLs (to be preserved)
https://alexandradiz.com/uploads/projects/kitchen-emerald-sky-hero.jpg
https://alexandradiz.com/uploads/projects/bathroom-relax-oasis-1.jpg
https://alexandradiz.com/uploads/about/alexandra-portrait.jpg
```

### CSS Migration Strategy
1. **Audit** Vigbo CSS: Remove unused selectors, consolidate duplicates
2. **Modularize**: Convert global styles to CSS Modules with BEM naming
3. **Tokenize**: Extract colors, spacing, typography into `:root` CSS variables:
   ```css
   :root {
     --color-text-primary: #1a1a1a;
     --color-bg-dark: #0a0a0a;
     --spacing-unit: 8px;
     --font-heading: 'Playfair Display', serif;
     --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   }
   ```
4. **Enhance**: Add CSS custom properties for theme switching (future dark mode)

### Third-Party Dependencies Audit
| Service | Current Use | Migration Plan |
|---------|------------|----------------|
| Vigbo Hosting | Full site | ✅ Replace with Vercel + custom domain |
| Vigbo Forms | Contact form | ✅ Replace with Resend + serverless function |
| Google Fonts | Typography | ✅ Keep same fonts, preload critical weights |
| Google Analytics | Tracking | ✅ Migrate to GA4 + consent mode |

---

> 💡 **Pro Tip for Development**: Start by building the `ProjectCard` and `ProjectGrid` components first — they're the visual core of the site. Reuse them in both public gallery and admin preview to ensure consistency.

*This specification is a living document. Update version control with each major scope change.*  
*Prepared for: Alexandra Diz Design | Migration Project* 🏡✨