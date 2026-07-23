# Claude design — mockups

Editorial UI mockups for Strummy and their implementation status. Each mockup is a
self-contained **Claude-artifact "Standalone" HTML bundle** (open one in a browser to
see the rendered screen). This directory tracks, batch by batch, which mockups have
been built into the app and how faithfully.

## Layout

```
claude design - mockups/
├── README.md                 # this file — how the dir works + the agent workflow
├── STATUS.md                 # ← the source of truth: per-screen done / partial / not
├── batch-01-core-editorial/  # batch 1: the 9 core CRUD views (forms, lists, details)
├── batch-02-incoming/        # drop the NEXT batch of *.html bundles here
└── tools/
    └── extract_bundle.py     # decode a bundle → its JSX design source
```

## For the next agent — implementing a new batch

1. **Read `STATUS.md` first.** It's the map of what's already built, how faithfully, and
   the prioritized backlog. Don't re-derive it.
2. **Decode each new bundle** to see what screens it contains and the design intent:
   ```bash
   python3 tools/extract_bundle.py "batch-02-incoming/Some Screen (Standalone).html" /tmp/x
   ```
   The small `src` entries (a few KB) are the real component source — each opens with a
   `// <Screen> — …` comment. The multi-MB `VENDOR` entry is bundled React; ignore it.
   To _see_ a bundle, serve the dir over HTTP and open it (browsers block `file://` for
   these): `python3 -m http.server` then visit the file. (`file://` won't render.)
3. **Find the live implementation** for each screen. The editorial components live under
   `components/<domain>/editorial/`; routes under `app/dashboard/<domain>/`. Confirm
   whether a component is actually mounted (grep `app/` for its import) before assuming.
4. **Compare design vs. code**, then **append a batch section to `STATUS.md`** with the
   same table shape as batch 01 (route · component · fidelity · status · open gaps).
5. **Implement in priority order** — Tier 1 (latent/unwired) → Tier 2 (correctness/polish)
   → Tier 3 (defer to v1.1). Respect the trust-pass note in `STATUS.md`: new
   student-facing features wait for real usage; correctness/consistency ship first.
6. Follow the repo's normal flow — one branch per fix off `main`, tests + `npm run lint`
   - `npm run typecheck`, a manual-test HTML under `docs/manual-tests/`, then a PR. Keep
     `STATUS.md` current as you ship (mark 🚀 with the PR number).

## Notes

- **Song Form has two directions** (A "Editorial single-page", B "Music Manuscript"). The
  app committed fully to **A**; B has no code. If a new batch iterates a screen, check
  `STATUS.md` for which direction/decision already shipped before building.
- The nine batch-01 bundles each embed the _whole_ design system, but only render their
  named screen — so screenshotting one file gives you that one screen.
