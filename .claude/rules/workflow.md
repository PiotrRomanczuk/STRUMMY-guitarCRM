---
description: Development workflow — Obsidian vault task tracking, commit format, PR conventions, release documentation
---

## Development Workflow

> Full details: `.claude/agents/git-workflow.md`

1. **Check vault before starting** -- open `~/Obsidian/MainCV-Planner/projects/guitar-crm.md` Now list; mark task WIP before starting
2. **Branch from `main`** -- `feature/short-description`, `fix/short-description`, `refactor/short-description`
3. **Commit format** -- `type(scope): description`
4. **Test before push** -- `npm run lint && npm test`
5. **Version bumps automatically on merge** -- patch (fix), minor (feature), major (label override)
6. **Create PR** -- descriptive title, reference Obsidian task in body
7. **Squash and Merge** to `main` → verify on Preview → merge to `production`

## Release Documentation (IMPORTANT)

**PR descriptions become GitHub Release notes** -- when merged to main, the workflow automatically:

- Creates annotated git tag (e.g., `v0.84.0`) with PR title
- Generates GitHub Release with full PR body
- Adds changelog links comparing versions

**Therefore**: Write PR descriptions as **user-facing release notes**, not internal technical details. Include:

- What features were added (in plain language)
- What bugs were fixed
- Breaking changes (if any)
- Migration guides for schema/API changes
- Screenshots for UI features

**Tags & Releases**: https://github.com/PiotrRomanczuk/guitar-crm/tags
