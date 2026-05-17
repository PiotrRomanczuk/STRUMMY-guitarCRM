# Music Lesson Platform Interface

_Started 2026-04-24 20:32 UTC_

---

## User



## Assistant

I'll design Strummy's lesson management system. Before building, let me ask a few focused questions to nail the direction.

_[tool: questions_v2]_

## User

Questions answered:
- starting_point: No — start fresh with an original look
- aesthetic: Decide for me
- role_focus: Teacher (primary user)
- views_priority: Lesson Detail, Lesson List, Lesson Form (wizard)
- primary_viewport: Show both side-by-side
- variations: One polished direction
- variation_axes: Decide for me
- song_progress_viz: Decide for me
- novelty: Decide for me
- live_mode_vibe: Decide for me
- music_flavor: Decide for me
- sample_data: Realistic students + real song titles (public domain / classics)
- deliverable_shape: Single clickable prototype with role/view switcher

## Assistant

I've got what I need. Let me plan and build.

_[tool: update_todos]_

_[tool: list_files]_

There's existing Strummy work. Let me explore it to align with the established visual direction.

_[tool: read_file]_

_[tool: read_file]_

Let me check the existing src files and direction.

_[tool: list_files]_

_[tool: read_file]_

Good — I see the established system. Editorial light with Fraunces/Geist, warm ivory palette, gold accent. Let me check the existing direction-a and primitives to match style precisely.

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: snip]_

I have what I need. The system is Editorial Light — Fraunces serif + Geist sans + Geist Mono, ivory/paper/card palette with gold accent, subtle music motifs. I'll build the Lessons module (List, Detail, Form Wizard, plus bonus Live Mode & Recurring) as a new clickable prototype file that reuses the existing primitives and data.

_[tool: write_file]_

_[tool: snip]_

Now the lesson primitives — shared bits specific to lessons (status badges, stage stepper, mobile frame, etc.):

_[tool: write_file]_

_[tool: snip]_

Now the Lesson List view — table on desktop, cards on mobile.

_[tool: write_file]_

_[tool: snip]_

Now the Lesson Detail view:

_[tool: write_file]_

