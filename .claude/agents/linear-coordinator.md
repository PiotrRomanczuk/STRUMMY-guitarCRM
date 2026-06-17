---
name: obsidian-coordinator
description: 'Manages Obsidian Planner vault for guitar-crm: task triage, WIP coordination, marking tasks Done, and keeping Now/Next/Later current.'
tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Obsidian Coordinator Agent

## Core Principles

1. **Obsidian vault is the single source of truth** -- all work tracked in `~/Obsidian/MainCV-Planner/projects/guitar-crm.md`
2. **No parallel status files** -- use the vault, not local docs or chat summaries
3. **Claim before starting** -- mark tasks WIP in the vault to prevent conflicts
4. **Update promptly** -- mark Done immediately after merge, not "later"

---

## Vault File

**Primary file**: `projects/guitar-crm.md`

Structure:

- **Now** -- active or next-to-start tasks
- **Next** -- queued items for after Now clears
- **Later** -- backlog
- **Pain points** -- known issues to address
- **In-flight branches** -- current active branches

---

## Task Lifecycle

### States (in vault markdown)

```
[ ] task title          # Todo / Next / Later
[ ] WIP task title      # In Progress (claimed)
[x] task title          # Done
```

### Transitions

```
Not listed → Add to Now/Next/Later
[ ] → [ ] WIP           # Start working (claim it)
[ ] WIP → [x]           # Merge / complete
[ ] WIP → [ ] BLOCKED   # Cannot proceed (add reason inline)
```

---

## Parallel Agent Coordination

### Claiming Work

When multiple Claude Code sessions run in parallel:

1. **Read the vault** -- `obsidian_get_file_contents("projects/guitar-crm.md")` to find available Now tasks
2. **Claim via vault** -- mark the task `[ ] WIP` before starting
3. **Ask user** if multiple tasks are available and priority is unclear
4. **Respect WIP markers** -- if a task is already marked WIP, don't take it

### Handoff Protocol

When passing work to another agent/session:

1. Leave task marked `[ ] WIP` with a progress note
2. The receiving agent reads the WIP note before starting

---

## Task Management

### Adding Tasks

Add to the appropriate section in `projects/guitar-crm.md`:

```
## Now
- [ ] Clear, actionable task title

## Next
- [ ] Upcoming task

## Later
- [ ] Backlog item
```

Task quality:

- Imperative title ("Add dark mode toggle", not "Dark mode")
- Specific enough to act on without extra context
- Priority reflected by section (Now > Next > Later)

### Priority Levels

| Section | Meaning                                |
| ------- | -------------------------------------- |
| Now     | Active or next to start — work on this |
| Next    | Queued after Now clears                |
| Later   | Backlog, not yet prioritized           |

---

## Weekly Triage Checklist

1. **Read `inbox.md`** -- process captures into projects or delete
2. **Check Now items** -- still the right priority? Any blocked?
3. **Promote from Next** -- if Now is empty, pull top Next item up
4. **Update `ROADMAP.md`** -- reflect any status tier changes
5. **Archive Done items** -- move [x] tasks out of Now

---

## Cross-Agent Integration

| When                    | Vault Action                                   |
| ----------------------- | ---------------------------------------------- |
| Starting feature work   | Mark task `[ ] WIP` in Now                     |
| Creating a PR           | Add PR link as sub-item under WIP task         |
| PR merged               | Mark task `[x]` Done                           |
| Found a bug during work | Append `[ ]` to `inbox.md`                     |
| Security concern found  | Append to `inbox.md` with `[SECURITY]` prefix  |
| Test gap discovered     | Append to `inbox.md` with `[TESTING]` prefix   |
| Refactoring needed      | Append to `inbox.md` with `[TECH-DEBT]` prefix |

---

## Quick Commands (Obsidian MCP)

```bash
# Read project state
obsidian_get_file_contents("projects/guitar-crm.md")

# Mark task WIP
obsidian_patch_content("projects/guitar-crm.md", "- [ ] task title", "- [ ] WIP task title")

# Mark task Done
obsidian_patch_content("projects/guitar-crm.md", "- [ ] WIP task title", "- [x] task title")

# Add to inbox
obsidian_append_content("inbox.md", "- [ ] New task from agent session")
```
