# Homepage Personal Brand Design

Date: 2026-04-24
Scope: public navigation restructuring, SEO-friendly project routes, and a new personal-brand homepage for Alexandra Diz

## Goal

Rebuild the public homepage so that:

- the homepage presents Alexandra Diz first as a premium designer and remodeling expert;
- projects move into a dedicated portfolio branch under `/projects`;
- the header becomes simpler and more intentional;
- the homepage feels like a modern design studio site, not a category index;
- one clear section on the homepage still routes users into the project portfolio;
- testimonials become part of the homepage narrative.

## In Scope

- new public header structure;
- route restructuring for portfolio pages under `/projects`;
- homepage redesign with new content hierarchy;
- placeholder zones for Alexandra's personal photography;
- homepage motion design and interaction rules;
- testimonial slider section;
- project CTA section on the homepage.

## Out Of Scope

- final owner-approved copy;
- final personal photography and video assets;
- admin-side homepage composer;
- full SEO content generation workflow;
- blog redesign.

## Public Navigation

The header should use this top-level structure:

- `Home`
- `Projects`
- `Blog`
- `Video`
- `Services`
- `About`
- `Contact`

### Projects Dropdown

`Projects` should behave like the existing dropdown pattern used for `Services` and `About`.

Dropdown items:

- `Kitchens`
- `Full House`
- `Bathroom`
- `ADU`
- `Fireplaces`

### Routing Direction

Use a clean portfolio route tree:

- `/`
- `/projects`
- `/projects/kitchens`
- `/projects/full-house`
- `/projects/bathroom`
- `/projects/adu`
- `/projects/fireplaces`
- `/projects/kitchens/:slug`
- `/projects/full-house/:slug`
- `/projects/bathroom/:slug`
- `/projects/adu/:slug`
- `/projects/fireplaces/:slug`
- `/blog`
- `/blog/:slug`

### Route Strategy

This is the preferred direction because it is cleaner for:

- SEO;
- breadcrumb logic;
- future filtering;
- future portfolio expansion;
- header consistency.

Legacy routes can be redirected later if needed, but the target public structure should be the `/projects/...` hierarchy.

## Homepage Positioning

The homepage should not behave like a list of project categories anymore.

It should feel like:

- a premium interior architecture studio;
- a personal brand page for Alexandra Diz;
- a trust-building introduction before the user explores projects.

The emotional tone should be:

- calm;
- refined;
- expensive;
- cinematic;
- practical rather than overly decorative.

## Homepage Structure

## 1. Hero Section

### Layout

Full-screen hero with background video.

Video direction:

- Alexandra working;
- design process;
- material review;
- on-site moments;
- premium interior fragments.

If no real video exists yet, use a temporary placeholder video/image stage that preserves the final composition.

### Content

- large `h1` tied to interior transformation;
- short support paragraph;
- two CTAs:
  - `View projects`
  - `Book consultation`

The `h1` should feel stronger than generic phrases like `Make your dream`.
Direction:

- practical dream + design intelligence;
- beauty + usability;
- transformation + clarity.

Example tone:

- `Designing interiors that feel as good as they look`
- `Interiors shaped for real life, not just for show`

Final line can still be changed during implementation.

### Motion

- soft zoom or depth movement in the video layer;
- staggered text reveal;
- subtle fade for CTA buttons;
- no aggressive slider dots or busy controls.

## 2. Alexandra Introduction Block

This is the primary personal-brand section.

Layout:

- strong editorial two-column composition;
- one side for a large portrait placeholder;
- one side for text about Alexandra.

Content should communicate:

- who Alexandra is;
- what kind of interiors she creates;
- how she combines aesthetics and function;
- why clients can trust her process.

Temporary personal-photo placeholders are acceptable, but they should be styled as intentional image frames, not broken empty boxes.

## 3. What Alexandra Does

This section should replace generic service text with more visual, premium cards.

Suggested cards:

- `Interior architecture`
- `Kitchen remodeling`
- `Bathroom design`
- `Full-home transformation`

Each card should have:

- short high-value copy;
- refined hover behavior;
- subtle motion;
- a layout that feels more like editorial service tiles than default feature cards.

## 4. Process Story Section

Purpose:

- explain that Alexandra does not just decorate spaces;
- show a structured, professional approach.

Suggested stages:

- `Plan`
- `Refine`
- `Build`
- `Reveal`

Visual direction:

- scroll reveal;
- line-based connectors or calm timeline rhythm;
- premium minimal styling rather than infographic clutter.

## 5. Projects Gateway Section

The homepage still needs a clear path into the portfolio.

This section should act as the bridge from personal-brand storytelling into project exploration.

Structure:

- strong heading introducing the portfolio;
- short text about built results;
- category previews or selected project previews;
- CTA to `/projects`.

This section should feel curated, not like the homepage turning back into a category archive.

## 6. Testimonials Section

Add a dedicated testimonials block with text-only slides.

### Content Model

Each testimonial should show:

- quote text;
- person name;
- optional role, city, or project reference.

### Interaction

- horizontal slider or fade slider;
- no heavy arrows;
- clean text-first presentation;
- optional autoplay with calm interval;
- touch support on mobile.

The tone should feel editorial and trustworthy, not like a generic plugin carousel.

## 7. Blog Preview Section

The homepage should also introduce the blog as a softer educational/content layer.

Purpose:

- show that Alexandra shares expertise, process thinking, and design guidance;
- create another SEO-friendly entry point;
- support trust without competing with the project portfolio.

Structure:

- short heading;
- supporting text;
- preview of selected or recent blog posts;
- CTA button to `/blog`.

This section should feel lighter than the projects gateway and should sit naturally inside the homepage flow.

## 8. Final CTA Section

End the homepage with a strong invitation to start a project.

Content:

- concise heading;
- short support text;
- contact CTA.

This block should feel confident and quiet, not salesy.

## Visual Language

### General Direction

The homepage should feel closer to a premium studio or editorial portfolio than to a catalog.

Use:

- large image and video stages;
- cinematic overlays;
- layered spacing;
- restrained typography contrast;
- soft gradients and depth;
- subtle glass/blur only where it actually helps.

### Personal Photography

Use temporary placeholders for Alexandra's photography in these zones:

- main intro portrait;
- optional secondary studio/lifestyle image;
- any future quote/editorial image block if needed.

These placeholders must be visually integrated and easy to replace later.

## Motion Direction

Use modern motion, but keep it restrained.

Allowed:

- reveal on scroll;
- soft hero zoom;
- staggered fade-up text;
- refined hover transitions;
- small parallax offsets where useful.

Avoid:

- noisy floating effects;
- giant sliders with obvious controls;
- animation that distracts from the portfolio tone.

## Responsive Behavior

### Mobile

- hero must stay strong and readable;
- video can degrade gracefully to poster image if needed;
- CTAs remain visible without crowding;
- Alexandra intro block stacks cleanly;
- testimonial slider remains readable;
- project gateway remains image-led without oversized media.

### Tablet

- preserve premium spacing;
- keep editorial rhythm in stacked or semi-stacked form;
- avoid cramped header navigation.

### Desktop

- use large visual stages;
- keep text lines controlled;
- do not let any section collapse into narrow strips.

## Copy Direction

Homepage copy should consistently communicate:

- professionalism;
- clarity;
- practical design intelligence;
- calm confidence;
- personalized transformation.

The copy should avoid:

- vague luxury clichés;
- generic agency language;
- overly technical renovation wording in hero sections.

## Implementation Priority

1. route structure for `/projects/...`
2. header navigation update
3. homepage hero rebuild
4. Alexandra introduction section
5. service/value cards
6. process section
7. projects gateway section
8. testimonials slider
9. blog preview section
10. final CTA
11. responsive polish and motion pass

## Notes For Implementation

- keep the current public pages usable while routes are being migrated;
- reuse existing theme system instead of inventing a separate homepage theme;
- temporary video and portrait placeholders are acceptable in the first pass;
- homepage project previews should pull from existing featured/available project data where possible;
- testimonial data can begin as temporary static content if backend content is not ready yet;
- blog preview can use existing post data and fall back to a temporary editorial preview layout if needed.
