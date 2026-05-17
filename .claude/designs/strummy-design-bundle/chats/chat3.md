# Strummy Landing Page

_Started 2026-04-24 08:28 UTC_

---

## User



## Assistant

I'll redesign the Strummy landing page. Let me start by exploring what's already in the project and understanding the context.

_[tool: list_files]_

_[tool: list_files]_

There's existing work here. Let me examine what's been built.

_[tool: read_file]_

There's substantial existing work — an editorial light palette with Fraunces/Geist/Geist Mono, gold accents, and a fretboard explorer. Let me look at the current app structure and primitives to understand the established design vocabulary before building the landing page.

_[tool: read_file]_

So this is a design-canvas with multiple directions. Let me check primitives and one of the direction files to understand the visual language.

_[tool: read_file]_

Strong established visual vocabulary: editorial serif headings (Fraunces), Geist sans, Geist Mono, ivory/paper backgrounds, gold accents, thin rules, staff lines, chord diagrams, fretboards as graphical motifs. Let me peek at the existing directions briefly to absorb layout feel.

_[tool: read_file]_

I have enough context on the visual vocabulary. Let me ask the user some focused questions before building — a landing page is a big scope and I want to avoid wasted work.

_[tool: snip]_

Before I start, a few things to clarify so this lands the way you want. The design system you've already built (editorial light palette, Fraunces + Geist + Geist Mono, gold accents, fretboard and staff motifs, chord diagrams) is strong — I'll build the landing page on top of that vocabulary rather than inventing a new aesthetic. A quick note on the system reminder: I'll design the landing page from scratch rather than replicating any other landing page's distinctive UI.

A few things worth pinning down:

_[tool: questions_v2]_

## User

Questions answered:
- screenshots_available: Mix: real mock UI for the hero, placeholders for secondary features
- visual_direction: Decide for me
- hero_visual: Split-screen: product shot on one side, expressive typographic headline on the other
- problem_solution_format: A 'day in the life' narrative with timestamps, showing how Strummy slots in
- headline_tone: Warm & crafted ('The studio your students deserve.')
- sections_to_include: Hero, Nav bar (sticky), Problem → Solution, Feature showcases (3-4 deep), Final CTA band, 'Free during beta' simple card (no fake pricing), Founder story (instead of fake testimonials), Real metrics strip
- integrations_treatment: Real brand wordmarks (Google Calendar, Spotify, Gmail, Google Drive) — I'll draw text logos
- cta_links: Both CTAs just say [demo link] — I'll wire them up later
- mobile_treatment: Design desktop + a dedicated mobile artboard (390) side by side on the canvas
- tweaks_wanted: Theme (light/dark) — already wired
- canvas_or_standalone: Both — artboard on canvas for comparison + standalone for a real-feel preview

## Assistant

I've got what I need. Let me lay out the plan and get building.

**My direction:** Editorial base with a couple of bold expressive moments (hero headline + final CTA band). Warm headline ("The studio your students deserve."). Split-screen hero — serif typography commanding the left, real mock Teacher Dashboard UI on the right using the existing primitives. Day-in-the-life timeline for the problem/solution section. Feature showcases alternate sides, each with a scaled mock UI built from real primitives for hero/feature 1, stylized placeholders for the rest. Integrations as real brand wordmarks drawn in text. Founder vignette in place of testimonials. A "free during beta" card, metrics in serif numerals, and a gold-gradient CTA band before a minimal footer.

_[tool: update_todos]_

Let me quickly check a couple more files to understand the existing mock UI better for the hero.

_[tool: read_file]_

_[tool: read_file]_

_[tool: snip]_

Good. I have the full picture. Now I'll build the landing page. I'll split it into a few JSX files to keep each under 1000 lines.

Let me start with the landing page primitives and hero:

_[tool: write_file]_

Now the hero section — the most important moment. Split-screen with a bold serif headline and a real mock dashboard.

_[tool: write_file]_

_[tool: snip]_

Now the body sections: day-in-the-life timeline, features, integrations, metrics, founder, beta card, CTA.

_[tool: write_file]_

_[tool: snip]_

Now the full landing page composer and mobile variant.

_[tool: write_file]_

_[tool: snip]_

Now wire the landing page into app.jsx as a new DCSection and add script tags to Strummy.html. Let me also create the standalone file.

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: str_replace_edit]_

Now let me create a standalone landing page HTML file (so user can see a fullscreen version outside the canvas), then run verification.

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Done. The redesigned Strummy landing page is live:

- **Strummy Landing.html** — standalone fullscreen version
- **Strummy.html** — design canvas now has a new "Landing Page" section with desktop (1440) + mobile (390) artboards side-by-side for comparison with the existing dashboard/fretboard/form explorations

**What's in it:**
- **Hero** — split-screen: serif headline ("The studio your students *deserve*.") on the left, tilted browser frame with a real mock dashboard (built from your existing primitives — sidebar, chord grid, agenda, health dots, Fraunces numerals) plus floating chord + activity cards on the right
- **Day-in-the-life** — side-by-side Before/After timeline with timestamps, diagonal crosshatch on the "before" column
- **Four feature showcases** — alternating layout; Feature 01 uses a real mock student-profile screen built from primitives, others use honest striped monospace placeholders labelled for drop-in later
- **Integrations bar** — Google Calendar / Spotify / Gmail / Google Drive as clean wordmark cards (no brand logo recreation)
- **Metrics strip**, **Founder story** (with placeholder portrait + placeholder quote clearly marked), **"Free during beta" card**, **gold-gradient Final CTA band** with a faint fretboard motif, and a minimal footer
- Respects the theme tweak (light/dark already wired)

**Known placeholders** to swap in later: real dashboard/lessons/songs/fretboard screenshots, real founder photo + quote, real CTA destinations.

## User

Apply comment

## Assistant

_[tool: snip]_

The comment is on the main content area of the HeroDashboard — `div[2/2]` under `.app-viewport` is the main panel (not the sidebar). The user says it doesn't look good. Let me screenshot to see what's happening.

_[tool: show_html]_

_[tool: show_html]_

_[tool: save_screenshot]_

_[tool: view_image]_

I can see the issues clearly now:
1. The hero text ("The studio your students deserve") overlaps with the subhead paragraph — lines are cramped together
2. The dashboard on the right looks cramped/broken: the content is cut off, stats cards look squished with "27 +2 of 31" overlapping awkwardly, the overall layout feels too tight and reads as broken rather than polished
3. "Started" tags are visible as red text on agenda rows
4. Font weights/sizes feel off — everything competing

The main issue: the dashboard is rendering at too narrow a width in the hero column (the tilted browser frame is squeezed), so the `grid-template-columns: repeat(4,1fr)` stat cards collapse. Also the hero headline has line-height too tight and overlaps.

Let me fix these.

_[tool: snip]_

The hero dashboard is cramped because it's rendering in a narrower column than expected. Let me redesign it — make the hero dashboard layout simpler and more readable at the hero's actual width, and tighten the hero headline.

_[tool: read_file]_

I'll rewrite the hero with a much cleaner, more polished approach: shorter/better-scaled headline, simpler dashboard mock that reads well at the actual column width (~620px), and better breathing room.

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

Let me verify the fix looks right with a quick screenshot before handing off.

_[tool: save_screenshot]_

_[tool: snip]_

_[tool: view_image]_

Hero looks much better now. The headline reads cleanly, the dashboard stats (3-up instead of 4-up) are readable, agenda is calm and spacious. One remaining issue: the floating chord card at bottom-left overlaps the agenda rows. Let me nudge it down and the activity pill right a bit.

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

I rebuilt the hero to fix the cramped dashboard and overlapping headline:

- Sidebar went from 168px → 54px icon-only, giving the main panel real breathing room
- Stats went from 4-up cramped → 3-up spacious, with clearer labels
- Agenda became a single calm card instead of competing with a side column
- Headline now reads cleanly with proper line-height
- Floating chord + activity cards repositioned so they don't overlap the dashboard content

