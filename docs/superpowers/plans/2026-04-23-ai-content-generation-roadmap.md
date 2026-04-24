# AI Content Generation Roadmap

## Goal
- Create a project, upload assets, enter basic facts, then generate project content and SEO from the admin panel.
- Allow targeted AI generation inside individual fields and blocks.

## Current Foundation
- Backend endpoints:
  - `POST /api/admin/projects/:id/ai/generate-page`
  - `POST /api/admin/ai/generate-text`
- Admin UI:
  - project-level `AI draft` panel
  - per-field `AI` button for editable text fields
- Current generator is deterministic and local. It is intentionally provider-ready, so a real model can be connected later without changing the admin flow.

## Next Implementation Steps
1. Add provider layer:
   - `OPENAI_API_KEY`
   - model setting
   - fallback to local generator if key is missing
2. Add prompt templates:
   - full project page
   - SEO title/description/keywords
   - block description
   - CTA copy
3. Add project input fields:
   - client brief
   - style
   - color palette
   - location/context
   - target audience
4. Add AI preview flow:
   - generate draft
   - preview diff
   - apply selected fields only
5. Add audit trail:
   - generated at
   - prompt used
   - model/provider
   - user who applied it

## Guardrails
- AI should never overwrite saved project content without user confirmation.
- AI should use only active project assets.
- Generated text should stay editable.
- SEO fields should be generated separately from page content.
