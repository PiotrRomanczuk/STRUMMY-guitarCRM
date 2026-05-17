# Feature 19: Onboarding

> **Tier**: 4 | **Priority**: Specialized

## Current Routes

| Route | Purpose |
|-------|---------|
| `/onboarding` (or inline after signup) | New user onboarding flow |

## Component Tree

| File | LOC | Purpose |
|------|-----|---------|
| `components/onboarding/OnboardingForm.tsx` | ~200 | Main multi-step onboarding form |
| `components/onboarding/OnboardingLayout.tsx` | ~80 | Layout wrapper |
| `components/onboarding/GoalSelector.tsx` | ~120 | Goal/objective picker (multi-select) |
| `components/onboarding/SkillLevelSelector.tsx` | ~100 | Skill level selector |
| `components/onboarding/index.ts` | ~10 | Re-exports |

**Total**: 5 files, ~510 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| `completeOnboarding(data)` | `app/actions/onboarding.ts` | Updated profile + role |

### Zod Schemas
| Schema | File | Validates |
|--------|------|-----------|
| `OnboardingSchema` | `schemas/OnboardingSchema.ts` | firstName, lastName, role, goals, skillLevel, instruments |

## User Stories

### New Student (on phone, first time)
1. Enter name and select role (student)
2. Pick guitar skill level (beginner/intermediate/advanced)
3. Select learning goals (chords, fingerpicking, theory, songs)

### New Teacher (on phone, first time)
1. Enter name and select role (teacher)
2. Set up teaching preferences
3. Get guided to dashboard with quick-start checklist

## Mobile Pain Points (at 390px)

1. **Form is long** — all steps on one page, should be a step wizard
2. **Goal selector** — checkbox list needs larger touch targets
3. **Skill level** — radio buttons too close together
4. **No progress indicator** — user doesn't know how many steps remain
5. **Keyboard overlap** — name fields covered by mobile keyboard
6. **No visual appeal** — plain form, should have illustrations/animations for first impression

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/onboarding/Onboarding.tsx` | Full-screen step wizard with animations |
| `components/v2/onboarding/StepRole.tsx` | Role selection with large cards |
| `components/v2/onboarding/StepSkillLevel.tsx` | Visual skill level picker |
| `components/v2/onboarding/StepGoals.tsx` | Goal selection with chip buttons |
| `components/v2/onboarding/StepWelcome.tsx` | Welcome animation/confetti |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/onboarding/OnboardingForm.tsx` | Replaced by step wizard |
| `components/onboarding/GoalSelector.tsx` | Replaced by chip-based selector |
| `components/onboarding/SkillLevelSelector.tsx` | Replaced by visual picker |

### Shared Primitives Needed
- [x] `StepWizardForm` — multi-step form
- [ ] `ChipSelector` — large touch-target multi-select chips
- [ ] `LargeRadioCards` — full-width radio option cards
