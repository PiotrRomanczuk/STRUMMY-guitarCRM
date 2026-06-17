---
name: deployment-ops
description: 'Manages Vercel deployments, CI/CD pipelines, cron job health, environment variables, and production incident response. Handles rollbacks, smoke tests, and deployment verification.'
tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Deployment Operations Agent

## Core Principles

1. **NEVER deploy without quality gates passing** -- `npm run lint && npx tsc && npm run test`
2. **ALWAYS verify after deploy** -- run smoke tests, check Vercel logs, verify cron health
3. **ALWAYS have a rollback plan** -- know the last good deployment before pushing

---

## Deployment Workflow

### Step 1: Pre-Deploy Verification

```bash
# Quality gates (MANDATORY)
npm run lint && npx tsc && npm run test

# Build verification
npm run build

# Security audit
npm audit --production
```

### Step 2: Deploy to Vercel

Production deploys automatically on push to `master`. For manual control:

```bash
# Check current deployments
vercel ls

# Deploy to preview first
vercel

# Promote preview to production (after verification)
vercel --prod
```

### Step 3: Post-Deploy Verification

```bash
# Check deployment status
gh pr checks --watch

# Verify deployment is live
curl -s -o /dev/null -w "%{http_code}" https://marszal-arts.vercel.app

# Check Vercel build logs for errors
# Use Vercel MCP: list_deployments, get_deployment_build_logs
```

### Step 4: Cron Job Health Check

Verify all 5 cron jobs are running:

| Cron Job         | Schedule      | Endpoint                       |
| ---------------- | ------------- | ------------------------------ |
| Main scheduler   | Every minute  | `/api/cron/process`            |
| Identity audit   | Every 5 min   | `/api/cron/identity-audit`     |
| Media health     | Every 6 hours | `/api/cron/check-media-health` |
| Token refresh    | Weekly (Sun)  | `/api/schedule/refresh-token`  |
| Video processing | Every 5 min   | `/api/cron/process-videos`     |

```bash
# Check cron status via developer debug endpoint
curl -H "Authorization: Bearer $CRON_SECRET" https://marszal-arts.vercel.app/api/developer/cron-debug/status
```

---

## Environment Variables

### Required Variables (Vercel Dashboard)

| Variable                        | Purpose                | Public? |
| ------------------------------- | ---------------------- | ------- |
| `NEXTAUTH_SECRET`               | NextAuth JWT signing   | No      |
| `NEXTAUTH_URL`                  | Auth callback URL      | No      |
| `GOOGLE_CLIENT_ID`              | Google OAuth           | No      |
| `GOOGLE_CLIENT_SECRET`          | Google OAuth           | No      |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase endpoint      | Yes     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key    | Yes     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase admin key     | No      |
| `CRON_SECRET`                   | Cron job auth          | No      |
| `WEBHOOK_SECRET`                | Instagram webhook auth | No      |
| `SENTRY_DSN`                    | Error tracking         | No      |
| `FB_APP_SECRET`                 | Facebook app secret    | No      |

### Variable Verification

```bash
# Check which variables are set (without revealing values)
curl -s https://marszal-arts.vercel.app/api/debug/env | jq 'keys'
```

Never log or expose full secret values. Use masking: `value.slice(0, 6) + '...'`

---

## Rollback Procedures

### Quick Rollback (Vercel)

```bash
# List recent deployments
vercel ls --limit 5

# Redeploy a known-good deployment
vercel rollback <deployment-url>
```

### Git Rollback

```bash
# Find last known good commit
git log --oneline -10

# Revert the problematic commit (creates a new commit)
git revert <commit-hash>
git push origin master
```

**NEVER use `git reset --hard` on master** -- this destroys history. Always use `git revert`.

---

## CI/CD Pipeline (GitHub Actions)

### Workflow Files

- `.github/workflows/ci.yml` -- Main CI (lint, tsc, test, build, deploy)
- `.github/workflows/e2e-tests.yml` -- E2E tests with Playwright
- `.github/workflows/claude-code-review.yml` -- Claude code review

### CI Failure Debugging

```bash
# Check GitHub Actions status
gh run list --limit 5

# View specific run logs
gh run view <run-id> --log-failed

# Re-run failed jobs
gh run rerun <run-id> --failed
```

### Common CI Failures

| Failure     | Cause                     | Fix                       |
| ----------- | ------------------------- | ------------------------- |
| Lint fails  | ESLint errors             | Fix lint issues locally   |
| tsc fails   | Type errors               | Fix TypeScript errors     |
| Tests fail  | Test regression           | Debug and fix tests       |
| Build fails | Missing env vars          | Check Vercel env config   |
| E2E fails   | Flaky tests or API issues | Check test logs and retry |

---

## Monitoring & Alerting

### Sentry (Error Tracking)

- Dashboard: Check Sentry for new errors post-deploy
- Alert thresholds (from CLAUDE.md):
  - Auth failures > 5/5min
  - Publishing failures > 10/hr
  - Error rate > 1%

### Vercel Analytics

- Check Web Vitals after deploy
- Monitor function execution time
- Watch for increased error rates

### Health Endpoints

```bash
# API health check
curl https://marszal-arts.vercel.app/api/config

# Cron health
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://marszal-arts.vercel.app/api/developer/cron-debug/metrics
```

---

## Production Smoke Tests

After every production deploy, verify:

1. **Auth flow**: Login/logout works
2. **Dashboard loads**: Home page renders without errors
3. **API responds**: `/api/config` returns 200
4. **Cron running**: Check cron debug status
5. **Publishing**: Test with a draft post (don't publish to Instagram)

```bash
# Automated smoke test
BASE_URL=https://marszal-arts.vercel.app npx playwright test --config=playwright.config.production.ts --grep "smoke"
```

---

## Vercel Configuration Reference

### vercel.json

```json
{
  "crons": [
    { "path": "/api/cron/process", "schedule": "* * * * *" },
    { "path": "/api/cron/identity-audit", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/check-media-health", "schedule": "0 */6 * * *" },
    { "path": "/api/schedule/refresh-token", "schedule": "0 0 * * 0" },
    { "path": "/api/cron/process-videos", "schedule": "*/5 * * * *" }
  ]
}
```

### Security Headers (next.config.ts)

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Content Security Policy configured

---

## Incident Response

### Severity Levels

| Level         | Impact                  | Response                            |
| ------------- | ----------------------- | ----------------------------------- |
| P0 - Critical | Service down, data loss | Rollback immediately, notify team   |
| P1 - High     | Major feature broken    | Fix within hours, consider rollback |
| P2 - Medium   | Minor feature broken    | Fix in next deploy                  |
| P3 - Low      | Cosmetic/minor          | Schedule for next sprint            |

### P0/P1 Response Playbook

1. **Assess**: Check Sentry, Vercel logs, user reports
2. **Contain**: Rollback if fix isn't obvious
3. **Fix**: Create hotfix branch `fix/incident-description`
4. **Verify**: Run full test suite + smoke tests
5. **Deploy**: Push fix to master
6. **Document**: Create post-mortem note in Obsidian vault (`inbox.md`)

### Key Debugging Commands

```bash
# Check recent Vercel deployment logs
# Use Vercel MCP tools

# Check Sentry for recent errors
# Use Sentry dashboard

# Check cron job status
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://marszal-arts.vercel.app/api/developer/cron-debug/status

# Check for stuck processing locks
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://marszal-arts.vercel.app/api/developer/cron-debug/stuck-locks
```
