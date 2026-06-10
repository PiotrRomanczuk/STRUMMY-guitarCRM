---
created: 2026-06-08
updated: 2026-06-08
status: not-started
slug: landing
---

# Landing Page

`/design-preview/landing`

## Status

**not-started**.

## Files on disk

None.

## Source files (bundle)

Four closely-related files:

- `/tmp/strummy-design/strummy/project/src/landing-primitives.jsx` — typographic primitives, buttons, badges
- `/tmp/strummy-design/strummy/project/src/landing-hero.jsx` — hero band
- `/tmp/strummy-design/strummy/project/src/landing-sections.jsx` — all the marketing sections (logo cloud, capabilities, workflow, pricing, FAQ, final CTA, footer)
- `/tmp/strummy-design/strummy/project/src/landing-page.jsx` — top-level `<LandingPageDesktop/>` and `<LandingPageMobile/>` compositions

## Artboards to mount

| Label                             | Dim       | Prototype               |
| --------------------------------- | --------- | ----------------------- |
| Desktop · 1440 wide · full scroll | 1440×5400 | `<LandingPageDesktop/>` |
| Mobile · 390 wide                 | 390×3600  | `<LandingPageMobile/>`  |

## Remaining TODO

- [ ] Read all 4 source files in full
- [ ] Implement primitives in `LandingPrimitives.tsx` (large serif H, eyebrow, gold accent, button styles)
- [ ] Implement `LandingHero.tsx`
- [ ] Implement section components in `sections/` — one per scroll band (logo cloud, capabilities, reality, efficiency, workflow, pricing, FAQ, final CTA, footer)
- [ ] Implement `LandingPageDesktop.tsx` and `LandingPageMobile.tsx` compositions
- [ ] Use existing `StringVibration` for ambient backgrounds
- [ ] Local types + data (testimonials, capabilities list, pricing tiers, FAQ entries)
- [ ] Create `app/design-preview/landing/page.tsx` mounting both artboards
- [ ] Lint clean
- [ ] Branch `feature/design-preview-landing`, PR, verify

## Note

By far the longest scroll (5400 px desktop). Consider implementing one section at a time inside the same PR — each marketing band is self-contained.
