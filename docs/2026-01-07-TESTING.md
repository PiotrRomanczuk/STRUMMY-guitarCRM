# Testing Guide

## 📊 Testing Strategy Overview

Guitar CRM uses a **Strategic Hybrid Approach** combining:
- **Jest** for unit tests (business logic, utilities)
- **Cypress** for E2E tests (user workflows, integrations)

### Test Pyramid

```
    🔺 E2E Tests (Cypress)        - User journeys
   🔸🔸 Integration Tests          - Feature interactions
  🔹🔹🔹 Unit Tests (Jest)          - Business logic
```

---

## 🚀 Quick Start Commands

### Jest Unit Tests

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:unit         # Unit tests only
```

### Cypress E2E Tests

```bash
npm run cypress:open      # Visual test runner
npm run cypress:run       # Headless mode
npm run test:smoke        # Quick smoke tests (<30s)
npm run test:integration  # Integration tests
npm run test:features     # Feature tests
npm run test:regression   # Regression tests
```

### Combined Suites

```bash
npm run test:all          # Unit + Smoke (fast)
npm run test:full         # Complete suite
npm run test:ci:fast      # For PR validation
npm run test:ci:full      # For deployment
```

---

## 📁 Test Organization

### Jest Tests

```
__tests__/
├── components/           # Component unit tests
├── history/              # History tracking tests
lib/
├── **/*.test.ts          # Co-located unit tests
app/api/
├── **/*.test.ts          # API route tests
```

### Cypress E2E Tests

```
cypress/e2e/
├── smoke/                # Critical path (<30s)
│   ├── critical-path.cy.ts
│   └── app-health.cy.ts
├── integration/          # Cross-feature (2-4 min)
│   ├── auth-password-reset.cy.ts
│   ├── lesson-search-filter.cy.ts
│   └── song-search-filter.cy.ts
├── admin/                # Admin workflows
│   ├── admin-navigation.cy.ts
│   ├── admin-songs-workflow.cy.ts
│   ├── admin-users-workflow.cy.ts
│   └── admin-lessons-workflow.cy.ts
├── student/              # Student workflows
│   └── student-learning-journey.cy.ts
└── regression/           # Bug prevention
```

---

## 🎯 When to Run Each Test Type

| Scenario | Command | Runtime |
|----------|---------|---------|
| During development | `npm run test:watch` | Continuous |
| Before commit | `npm run test:smoke` | <30s |
| Before PR | `npm run test:all` | ~2 min |
| Feature complete | `npm run test:features` | ~8 min |
| Before release | `npm run test:full` | ~15 min |

---

## ⏱️ Performance Targets

| Test Type | Target | Max |
|-----------|--------|-----|
| Unit Tests | <15s | 30s |
| Smoke Tests | <30s | 60s |
| Integration | 2-4 min | 5 min |
| Features | 5-8 min | 10 min |
| Full Suite | <13 min | 20 min |

---

## 🧪 Writing Tests

### Jest Unit Test Example

```typescript
import { validateSong } from '@/schemas/SongSchema';

describe('SongSchema', () => {
  it('validates a complete song', () => {
    const song = {
      title: 'Wonderwall',
      author: 'Oasis',
      level: 'beginner',
      key: 'Em'
    };
    
    const result = validateSong(song);
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const song = { author: 'Oasis' };
    
    const result = validateSong(song);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain('title');
  });
});
```

### Cypress E2E Test Example

```typescript
describe('Admin Song Workflow', () => {
  beforeEach(() => {
    cy.login('admin');
  });

  it('creates a new song', () => {
    cy.visit('/dashboard/songs');
    cy.get('[data-testid="add-song-button"]').click();
    
    cy.get('[name="title"]').type('New Song');
    cy.get('[name="author"]').type('Artist Name');
    cy.get('[data-testid="submit-button"]').click();
    
    cy.contains('Song created successfully');
    cy.contains('New Song');
  });
});
```

---

## 🔧 Cypress Custom Commands

```typescript
// Login as specific role
cy.login('admin');
cy.login('teacher');
cy.login('student');

// Navigate to dashboard section
cy.navigateTo('songs');
cy.navigateTo('lessons');
cy.navigateTo('users');

// Form helpers
cy.fillForm({ title: 'Song', author: 'Artist' });

// Verify notifications
cy.verifyToast('Success');
```

---

## 📊 Coverage Requirements

### Target Coverage

| Area | Target |
|------|--------|
| Business logic (lib/) | 90%+ |
| API routes | 90%+ |
| Schemas | 100% |
| Critical paths (E2E) | 100% |
| Overall | 75%+ |

### Current State

| Metric | Current |
|--------|---------|
| Jest Statement Coverage | 22.23% |
| Jest Function Coverage | 39.4% |
| Cypress Pass Rate | 58% |

---

## 🐛 Debugging Tests

### Jest Debugging

```bash
# Verbose output
npm test -- --verbose

# Run specific test file
npm test -- path/to/test.test.ts

# Debug with Node inspector
npm run test:debug
```

### Cypress Debugging

```bash
# Visual test runner
npm run cypress:open

# Run with headed browser
npx cypress run --headed

# Run specific test
npx cypress run --spec "cypress/e2e/admin/admin-songs-workflow.cy.ts"
```

---

## ⚠️ Known Issues

### Student Authentication

Student tests are currently failing due to authentication issues:

```
student-learning-journey.cy.ts: 0/20 passing (auth failure)
```

**Workaround**: Use admin or teacher credentials for now.

### Pending Tests

Some test files have pending (not implemented) tests:
- `admin-assignments-workflow.cy.ts` - 8 pending
- `admin-lessons-workflow.cy.ts` - 6 pending

---

## ✅ Best Practices

### Unit Tests (Jest)

- ✅ Test business logic, not implementation
- ✅ Use descriptive test names
- ✅ Mock external dependencies
- ✅ Focus on edge cases
- ✅ Keep tests fast (<50ms each)

### E2E Tests (Cypress)

- ✅ Test user workflows, not functions
- ✅ Use realistic test data
- ✅ Clean up after tests
- ✅ Use `data-testid` for stable selectors
- ✅ Avoid flaky waits (use assertions)

### General

- ✅ Run tests after creating them
- ✅ Don't commit broken tests
- ✅ Update tests when features change
- ✅ Add regression tests for bugs

---

## 📚 Test Configuration Files

| File | Purpose |
|------|---------|
| `jest.config.ts` | Jest configuration |
| `jest.setup.js` | Jest setup/mocks |
| `cypress.config.ts` | Cypress configuration |
| `cypress/support/` | Cypress commands/fixtures |
| `cypress.env.json` | Cypress environment variables |

---

## 🔄 CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Every PR (smoke + unit tests)
- Merge to main (full test suite)
- Merge to production (full + regression)

### Vercel

- Preview deployments trigger smoke tests
- Production deployments require all tests passing
