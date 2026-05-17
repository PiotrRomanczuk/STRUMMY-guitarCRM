# Feature 17: AI Assistant

> **Tier**: 4 | **Priority**: Specialized

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/ai` | AI chat interface |
| `/dashboard/ai/history` | AI generation history |

## Component Tree

| File | LOC | Purpose |
|------|-----|---------|
| `components/ai/AIGenerationHistory.tsx` | ~100 | History list |
| `components/ai/AIGenerationHistory.Table.tsx` | ~80 | Table view |
| `components/ai/AIGenerationHistory.Detail.tsx` | ~80 | Detail view |
| `components/ai/AIGenerationHistory.Filters.tsx` | ~60 | Filter controls |
| `components/ai/AIStreamingStatus.tsx` | ~60 | Streaming indicator |
| `components/ai/AIErrorBoundary.tsx` | ~40 | Error handler |
| `components/ai/useAIGenerationHistory.ts` | ~60 | History data hook |
| `components/ai/ai-generation.helpers.ts` | ~40 | Utility functions |
| `components/ai/index.ts` | ~10 | Re-exports |

**Total**: 9 files, ~530 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| `generateAIResponseStream()` | `app/actions/ai.ts` | Streaming text response |
| `generateAIResponse()` | `app/actions/ai.ts` | Complete text response |
| `getAvailableModels()` | `app/actions/ai.ts` | Model[] list |
| `generateLessonNotesStream()` | `app/actions/ai.ts` | Streaming lesson notes |
| `generateAssignmentStream()` | `app/actions/ai.ts` | Streaming assignment |
| `generateEmailDraftStream()` | `app/actions/ai.ts` | Streaming email draft |
| `generatePostLessonSummaryStream()` | `app/actions/ai.ts` | Streaming summary |
| `analyzeStudentProgressStream()` | `app/actions/ai.ts` | Streaming analysis |
| `generateSongNotesStream()` | `app/actions/ai.ts` | Streaming song notes |
| `enhanceSongNotesStream()` | `app/actions/ai.ts` | Streaming enhanced notes |
| `generateAdminInsightsStream()` | `app/actions/ai.ts` | Streaming admin insights |

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useAIGenerationHistory` | `components/ai/useAIGenerationHistory.ts` | `/api/ai/history` |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/ai/debug` | GET | AI system debugging |

## User Stories

### Teacher (on phone)
1. Generate lesson notes for a student — quick AI summary based on lesson songs and goals
2. Draft an assignment with AI — describe what you want, AI structures it
3. Generate a post-lesson summary to share with the student

### Admin
1. View AI usage history — which features use AI most
2. Monitor AI generation costs and model selection
3. Debug AI provider connectivity

## Mobile Pain Points (at 390px)

1. **Chat interface** — text input area needs mobile keyboard handling, auto-grow
2. **Streaming response** — long text streams cause jank, need virtual scrolling
3. **Model picker** — dropdown with many models needs full-screen selector
4. **History table** — columns overflow, timestamps truncated
5. **Code in responses** — AI-generated code blocks need horizontal scroll with proper formatting
6. **Context switching** — generating notes for a lesson should link back to that lesson

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/ai/AIChat.tsx` | Mobile chat interface with auto-growing input |
| `components/v2/ai/AIChat.Desktop.tsx` | Desktop side-panel chat |
| `components/v2/ai/AIHistory.tsx` | Card-based history list |
| `components/v2/ai/StreamingMessage.tsx` | Optimized streaming display |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/ai/AIGenerationHistory.Table.tsx` | Replaced by card list |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [ ] `AutoGrowTextArea` — auto-expanding text input
- [ ] `StreamingText` — optimized streaming text renderer
- [ ] `CodeBlock` — horizontally scrollable code display
