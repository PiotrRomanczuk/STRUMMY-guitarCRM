---
created: 2026-07-18
updated: 2026-07-18
domain: AI Assistant
tables:
  [
    ai_conversations,
    ai_messages,
    ai_generations,
    ai_prompt_templates,
    ai_usage_stats,
    agent_execution_logs,
  ]
maturity: mixed
---

# AI Assistant

## Purpose

Teacher/admin authoring aids powered by a provider-abstracted AI layer (`lib/ai`): a general chat
playground, context-aware generators (lesson notes, assignment descriptions, email drafts,
progress insights), and a persistent generation history. Students have **no AI surface** by
design. Two providers behind one interface: **OpenRouter** (cloud) and **Ollama** (local LLM on
the home Windows box), with per-model mapping between them.

## Data model

| Table                  | Role                                                                                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai_conversations`     | Chat sessions: owner, `model_id`, `context_type` (`general/student/lesson/song/assignment/practice`) + `context_id`, archive flag                                                                                                  |
| `ai_messages`          | Messages in a conversation: `role` (`system/user/assistant`), content, `tokens_used`, `latency_ms`, `is_helpful` feedback                                                                                                          |
| `ai_generations`       | Structured one-shot outputs: `generation_type` (`lesson_notes/assignment/email_draft/post_lesson_summary/student_progress/admin_insights/chat`), agent/model/provider, `input_params` jsonb, output text, success/error, starrable |
| `ai_prompt_templates`  | Reusable prompt templates by category — **dormant**: zero references in `app/` or `lib/`                                                                                                                                           |
| `ai_usage_stats`       | Daily per-user × per-model aggregates (requests, tokens, latency, errors) — dormant observability, see dispositions                                                                                                                |
| `agent_execution_logs` | Per-agent execution telemetry (success, duration, input hash, error code) — dormant observability, see dispositions                                                                                                                |

**Dormant-table dispositions** (no user-facing surface; keep, don't build on):

- `ai_usage_stats` — written by `app/actions/ai-conversations.ts` on each chat request; read by
  nothing. Retain as rate-limiting/analytics substrate; no UI planned.
- `agent_execution_logs` — written/read only by `lib/ai/registry/analytics.ts`; no UI consumer.
  Retain; surfacing belongs to the (parked) admin debug dashboard (doc 10).
- `ai_prompt_templates` — schema-only. Candidate for removal in a future schema-slim pass;
  harmless meanwhile.

## Behavior & rules

- **Provider abstraction** — `lib/ai/provider-factory.ts` selects OpenRouter or Ollama;
  `lib/ai/model-mappings.ts` translates model ids both ways. `OLLAMA_DEFAULT_MODEL` env overrides
  the static mapping for every local request (a local host only serves pulled models).
- **Agent registry** — `lib/ai/agent-registry.ts` + `lib/ai/agents/` define the task agents:
  analytics, assignment, chat, communication (email drafts), content, lesson-notes,
  post-lesson-summary, song-normalization, song-notes, song-notes-enhancer. Executions are logged
  to `agent_execution_logs` via `lib/ai/registry/analytics.ts`.
- **Chat flow** — `app/actions/ai-conversations.ts`: creates/loads `ai_conversations`, appends
  `ai_messages`, upserts the day's `ai_usage_stats` row per request.
- **Generations** — one-shot agent outputs persist to `ai_generations` (starrable, filterable by
  type/context) and power the history UI.
- **Guardrails** — `lib/ai/rate-limiter.ts` (per-user throttling), `retry.ts`,
  `token-estimation.ts`, `queue-manager.ts`, streaming via `AIStreamingStatus`.
- **Access** — teacher/admin only; `/dashboard/ai` redirects students to `/dashboard`.

## UI surfaces

All AI nav items (`ai`, `ai-chat`) are in `CORE_LOOP_HIDDEN_ITEMS` → **nav-hidden** per the
core-loop trust pass; routes stay URL-reachable.

| Surface            | Route                                                                                          | Status                               |
| ------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------ |
| AI hub             | `/dashboard/ai` — `EmailDraftGenerator`, `StudentProgressInsights`, `AdminDashboardInsights`   | **nav-hidden**                       |
| Chat playground    | `/dashboard/ai/chat` — `components/ai/chat/*` (model switcher, conversation reset)             | **nav-hidden**                       |
| Generation history | `/dashboard/ai/history` — `AIGenerationHistory` (+ Filters/Table/Detail) over `ai_generations` | **nav-hidden**                       |
| Inline generators  | Lesson-notes AI, assignment-description AI inside their domain editors (docs 02, 06)           | **mounted** (inside mounted editors) |

## Gaps & planned work

### AIA-1 — local-LLM (Ollama) path unproven: fallback model + unfinished E2E

Verified in `lib/ai/model-mappings.ts`: `FALLBACK_MODELS.ollama = 'llama3.2:3b'`. On the home
Ollama host that model is not reliably served (unpulled → Ollama 404s; historically crashy on the
local GPU backend), so any unmapped model id sent to the local provider dies at the fallback. The
`OLLAMA_DEFAULT_MODEL` env override exists precisely to dodge this, but nothing pins it in
deployed envs, and the local-LLM AI E2E pass was never finished.

- **Files**: `lib/ai/model-mappings.ts`, `lib/ai/providers/ollama.ts` (also carries its own
  `LOCAL_FALLBACK_MODELS` list), env config for the dev/E2E stack.
- **Approach**: (1) change `FALLBACK_MODELS.ollama` to a model actually pulled on the Ollama host,
  or resolve the fallback dynamically from the provider's model listing (which `ollama.ts` already
  queries); (2) set `OLLAMA_DEFAULT_MODEL` in the E2E env; (3) finish the local-LLM E2E pass — run
  `tests/e2e/ai/ai-playground.spec.ts` + `lesson-notes-ai.spec.ts` against the Ollama provider,
  not just OpenRouter.
- **Acceptance**: chat round-trip on the local provider succeeds with an unmapped model id (falls
  back without 404); all four `tests/e2e/ai/` specs green with provider=ollama.

### AIA-2 — `is_helpful` feedback captured nowhere (parked)

`ai_messages.is_helpful` exists but no UI writes it. Parked — feedback loop is post-v1 polish.

## Test plan

- **E2E** (`reference/E2E_JOURNEYS.md` §A9): `tests/e2e/ai/ai-playground.spec.ts` (A9.1 — send, switch
  model, clear), `assignment-ai.spec.ts` (A5.4), `lesson-notes-ai.spec.ts`,
  `lesson-notes-editorial.spec.ts`.
- **Unit**: `lib/ai/__tests__/model-mappings.test.ts` (fallback behavior), `agents.test.ts`,
  `provider-factory.test.ts`, `ai-rate-limiter.test.ts`, `useAIGenerationHistory.test.ts`.

## Open questions

- Is a student-facing AI surface (practice helper) ever in scope, or is teacher-authoring-only a
  standing decision? Currently enforced by redirect, not documented as an ADR.

## References

- Architecture internals (providers, streaming, context builders): `docs/app-blueprint/reference/ARCHITECTURE.md`
- Code: `lib/ai/*`, `app/dashboard/ai/*`, `components/ai/*`, `app/actions/ai-conversations.ts`
- Schema: `supabase/baseline/cloud_schema_2026-06-22.sql` (6 `ai_*`/agent tables, 4 AI enums)
- Nav gating: `components/navigation/menuConfig.ts` (`CORE_LOOP_HIDDEN_ITEMS`)
