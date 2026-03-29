---
name: verify
description: Run full quality gates (lint + typecheck + tests). Use before committing or when you want to check everything passes.
---

Run the project's quality gate command and report results:

```bash
npm run quality
```

This runs ESLint, TypeScript type checking, and all Jest tests in sequence.

If any step fails:
1. Show the specific errors clearly
2. Offer to fix them
3. Re-run only the failed step after fixing

Do NOT proceed with commits or PRs if quality gates fail.
