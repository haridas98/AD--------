# Migration Guide: Vigbo → React

## Current Architecture

The site currently uses a **hybrid approach**:
- **React Shell**: React Router handles navigation, provides SPA-like transitions
- **Legacy Content**: Page content is loaded from `/public/legacy/` HTML files
- **Caching System**: Loaded pages are cached in memory for faster subsequent loads
- **Dynamic DOM Injection**: Legacy HTML is parsed and injected into the React app

## Folder Structure

```
├── public/legacy/           # Original Vigbo HTML files
│   ├── index.html          # Homepage
│   ├── kitchens/           # Kitchen category pages
│   ├── bathrooms/          # Bathroom pages
│   ├── full-house-remodeling/
│   └── ...
├── src/
│   ├── pages/
│   │   ├── LegacySite.jsx  # Main legacy content loader
│   │   ├── AdminPage.jsx   # Admin panel (fully React)
│   │   └── ...
│   ├── components/         # React components (Header, Footer, etc.)
│   ├── generated/          # Auto-generated route and image maps
│   └── App.jsx             # Main app with routing
```

## Migration Phases

### Phase 1: ✅ COMPLETE - Foundation
- [x] Setup React + Vite project
- [x] Add React Router for SPA navigation
- [x] Create legacy HTML loader with caching
- [x] Fix grid/overlap issues with CSS overrides
- [x] Add smooth page transitions

### Phase 2: 🔄 IN PROGRESS - Hybrid System
- [x] Implement page caching for faster navigation
- [x] Add loading states for better UX
- [x] Improve responsive grid behavior
- [ ] Create React Header/Footer components (replacing legacy)
- [ ] Migrate simple pages (Contact, About) to React

### Phase 3: 📋 PLANNED - Content Migration
Priority order for page migration:
1. **Static Pages** (easiest):
   - Contact page
   - About Me
   - Services pages
   
2. **Category Pages**:
   - Kitchens index
   - Bathrooms index
   - Full House Remodeling index
   
3. **Project Pages** (most complex):
   - Individual project detail pages
   - Before/After galleries
   - Video series

### Phase 4: 🔮 FUTURE - Full React
- Remove legacy HTML files entirely
- Create CMS-like admin panel for content management
- Implement dynamic image optimization
- Add proper SEO meta management

## Key Technical Decisions

### Caching Strategy
```javascript
const pageCache = new Map(); // In-memory cache
```
- Pages are cached after first load
- Prevents redundant network requests
- Enables instant navigation for visited pages

### URL Rewriting
All legacy URLs are rewritten to point to local files:
- `https://alexandradiz.com/css/custom.css` → `/legacy/custom.css`
- Image URLs mapped to local copies via `localImageMap`

### Grid System Fixes
Vigbo uses a 24-column grid system (like Bootstrap). Fixed in `legacy-fixes.css`:
- `col-md-24` → 100% width
- `col-md-12` → 50% width  
- `col-md-8` → 33.33% width
- Mobile: all columns stack to 100%

## Adding New Pages

### For Legacy Pages (Current)
Pages are automatically routed based on `src/generated/routeMap.js`.

To add a new legacy page:
1. Place HTML file in `public/legacy/[category]/[page]/index.html`
2. Update `src/generated/routeMap.js` with the route
3. Run `npm run dev`

### For React Pages (Future)
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Update navigation in Header component

## Development Commands

```bash
# Start dev server (React + API)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Sync images from legacy to local
npm run sync:images
```

## Troubleshooting

### Grid Overlap Issues
If you see overlapping content on any page:
1. Check `public/legacy-fixes.css` for grid rules
2. Ensure `.col-md-*` classes have proper flex properties
3. Verify sections have `clear: both` applied

### Images Not Loading
Images are mapped via `src/generated/localImageMap.js`:
- Check that image exists in map
- Verify URL format matches exactly (including protocol)
- Run `npm run sync:images` to update mappings

### Page Not Found
- Verify route exists in `src/generated/routeMap.js`
- Check that HTML file exists at the mapped path
- Ensure path doesn't start with `/admin` (reserved for admin panel)
