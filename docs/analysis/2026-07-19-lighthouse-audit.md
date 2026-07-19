# Strummy — Lighthouse Audit (public pages)

**Date**: 2026-07-19
**Author**: Claude
**Scope**: Tranche 4 debt item ("Repo → Lighthouse audit", `docs/app-blueprint/90-roadmap.md`). Lighthouse CLI against a local production build (`npm run build && next start`), headless Chrome, default mobile throttling. Public/unauthenticated pages only — authenticated dashboard pages need a signed-in Chrome session, which wasn't set up for this pass.

---

## Pages audited

| Page               | Perf                      | Accessibility             | Best Practices | SEO  |
| ------------------ | ------------------------- | ------------------------- | -------------- | ---- |
| `/` (landing)      | 0.56                      | 0.95                      | 0.92           | 1.00 |
| `/sign-in`         | 0.69 → **0.74** after fix | 0.92 → **0.96** after fix | 0.96           | 1.00 |
| `/sign-up`         | 0.74                      | 0.92                      | 0.96           | 1.00 |
| `/forgot-password` | 0.74                      | 0.96                      | 0.96           | 1.00 |

SEO is a clean 1.00 everywhere — nothing to do there. Best Practices is solid (0.92–0.96).

## Fixed in this pass

**Color contrast (all 4 pages).** `--primary` (`hsl(42 90% 45%)` / `#da9c0b`) measured 2.3–2.4:1 against both the light background and white button-fill text — well under the WCAG AA 4.5:1 minimum. Affected every gold-colored link, filled button, and CTA on every public page (`Forgot password?`, the sign-in button, `Try Demo Account`, `Create your account`, etc.). Darkened to `hsl(42 90% 30%)` (`#916808`) — same hue, clears 4.5:1 against white and ~4.8:1 against the background, verified by re-running Lighthouse (`color-contrast` audit: 0 → 1) and by screenshotting `/sign-in` to confirm the darker gold still reads as the brand color rather than looking muddy. Dark mode's `--primary` (`#ffd183`) wasn't flagged and was left untouched. See commit `61d278d2`.

This single CSS-variable fix is why `/sign-in`'s accessibility score moved 0.92 → 0.96 above; it should have the same effect on `/sign-up` and `/forgot-password` (not independently re-measured, since they share the same token) and on `/` (still shows the pre-fix score in the table above — see Not fixed below for why `/` needs its own look).

## Not fixed (documented, not actioned, this pass)

**Performance, especially `/` (0.56).** Root cause differs by page:

- **`/sign-in`, `/sign-up`, `/forgot-password` (0.69–0.74)**: `unused-javascript` flagged ~130 KiB of estimated savings; `total-blocking-time` is the main drag. Nothing alarming — typical Next.js client-bundle overhead for a form page with client-side validation. Worth a bundle-analyzer pass if perf work is prioritized later, not urgent.
- **`/` (0.56, LCP 12.5s in this run)**: the LCP element is a hero paragraph (`section.relative > div.relative > div.md:col-span-6 > p.mt-6`) with `opacity`/`transform` inline styles from an entrance animation (Framer Motion). Lighthouse's own breakdown only attributes ~3.2s to render delay (TTFB 50ms + 3150ms render delay), which doesn't add up to the reported 12.5s LCP — inconsistent enough between the summary metric and the breakdown insight that it smells like measurement noise from Lighthouse's default mobile CPU/network throttling colliding with an animated hero on a dev machine, rather than a reliable real-world number. **Needs a second, controlled measurement** (throttling off, or Chrome DevTools Performance panel directly) before treating 12.5s as ground truth or spending engineering time chasing it.

**Authenticated dashboard pages** — not audited at all this pass. The dashboard (lessons, songs, assignments, AI chat, etc.) is where teachers/students spend most of their time, and Lighthouse needs a real session cookie to reach it; that setup (reusing the Playwright `tests/.auth/*.json` storage state, or a dedicated Lighthouse user-flow script) wasn't built. Worth doing before/around the real launch if dashboard performance becomes a concern — the 5 real students will be the actual signal either way.

## How to re-run

```bash
npm run build
AI_PROVIDER=ollama AI_USE_VERCEL_SDK=false OLLAMA_BASE_URL=http://192.168.1.10:11434 \
  OLLAMA_DEFAULT_MODEL=gemma3:1b npx next start -p 3000 &

export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
npx -y lighthouse http://localhost:3000/sign-in \
  --output=json --output-path=/tmp/lighthouse-signin.json \
  --chrome-flags="--headless" --quiet
```
