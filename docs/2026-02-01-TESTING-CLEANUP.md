# Test Data Cleanup System

## Overview

Automated cleanup system to prevent test data pollution in the database from E2E tests.

## What Was Added

### 1. Cleanup Helper (`tests/helpers/cleanup.ts`)
- Identifies test data by pattern matching (titles, artists, names, emails)
- Deletes test data across all tables:
  - Assignment templates
  - Assignments
  - AI conversations (and messages via cascade)
  - Songs
  - Lessons
  - Pending students
  - Users (profiles) - cascades to practice sessions and song progress
  - Orphaned practice sessions and song progress
- Provides detailed logging and error reporting
- Safe deletion with individual error handling
- Deletion order ensures referential integrity

### 2. Global Teardown (`tests/global-teardown.ts`)
- Runs automatically after all Playwright tests complete
- Calls cleanup functions for all test data types
- Configured in `playwright.config.ts`

### 3. Manual Cleanup Script (`scripts/cleanup-test-data.ts`)
- Standalone script for manual cleanup
- 3-second countdown before execution (Ctrl+C to cancel)
- Accessible via `npm run test:cleanup`

### 4. Documentation (`tests/2026-03-16-2025-11-02-README.md`)
- Complete guide for E2E testing
- Test organization structure
- Best practices and troubleshooting

## Usage

### Automatic (Recommended)

Cleanup runs automatically after test suites:

```bash
npm run playwright:run
# or
npm run test:pw:songs
# or any other test command
```

After tests complete, you'll see:

```
🧹 Starting test data cleanup...

Found 2 test assignment templates to delete
Deleted test assignment template: E2E Template 1769983443220
Found 15 test songs to delete
Deleted test song: E2E Song 1769983443220
Deleted test song: Teacher Song 1769946438355
Found 3 test users to delete
Deleted test user: e2e.student.1769983443220@example.com
...

📊 Cleanup Summary:
  Assignment Templates deleted: 2
  Assignments deleted: 0
  AI Conversations deleted: 1
  Songs deleted: 15
  Lessons deleted: 3
  Pending Students deleted: 0
  Users deleted: 3
  Orphaned Practice Sessions deleted: 0
  Orphaned Song Progress deleted: 0
  ✅ Cleanup completed successfully
```

### Manual Cleanup

When you need to clean up immediately:

```bash
npm run test:cleanup
```

Use cases:
- Interrupted test runs
- Failed tests that didn't trigger teardown
- Manual database maintenance
- Before running tests on polluted database

## Test Data Patterns

The system identifies and deletes data matching these patterns:

### Songs
- **Titles**:
  - `E2E Song {timestamp}`
  - `E2E Edit Test {timestamp}`
  - `E2E API Test Song {timestamp}`
  - `Teacher Song {timestamp}`
  - Any title ending with `EDITED` or `UPDATED`
- **Artists**:
  - `E2E Test Artist`
  - `Teacher Test Artist`
  - Any artist starting with `E2E Test Artist`

### Lessons
- **Titles**:
  - `E2E Lesson {timestamp}`
  - `E2E Teacher Lesson {timestamp}`
  - `Teacher Lesson {timestamp}`
  - `Test Lesson {timestamp}`
- **Notes**:
  - `E2E Test lesson notes`

### Assignments
- **Titles**:
  - `E2E Assignment {timestamp}`
  - `Teacher Assignment {timestamp}`
  - `Test Assignment {timestamp}`
- **Descriptions**:
  - Any description starting with `E2E Test assignment description`

### Assignment Templates
- **Titles**:
  - `E2E Template {timestamp}`
  - `Teacher Template {timestamp}`
  - `Test Template {timestamp}`
- **Descriptions**:
  - Any description starting with `E2E Test template description`

### Users (Profiles)
- **Emails**:
  - `e2e.student.{timestamp}@example.com`
  - `e2e.teacher.{timestamp}@example.com`
  - `e2e.admin.{timestamp}@example.com`
  - `test.{timestamp}@example.com`
- **First Names**:
  - `E2ETest`
  - `E2EEdited`
  - Any name starting with `E2E`

**Note**: Deleting users automatically cascades to delete their:
- Practice sessions
- Student song progress
- Lessons (where they are teacher or student)
- Assignments

### Pending Students
- **Emails**:
  - `e2e.pending.{timestamp}@example.com`
  - `test.pending.{timestamp}@example.com`

### AI Conversations
- **Titles**:
  - Any title starting with `E2E Test Conversation`
  - Any title starting with `Test AI Conversation`

**Note**: Deleting conversations automatically cascades to delete related AI messages

### Orphaned Data
The system also cleans up orphaned records (if RPC functions exist):
- Practice sessions without valid student or song references
- Student song progress without valid student or song references

## Customization

### Adding New Patterns

Edit `tests/helpers/cleanup.ts`:

```typescript
const TEST_PATTERNS = {
  songs: {
    titles: [
      /^E2E Song \d+/,
      /^MyNewPattern \d+/,  // Add your pattern
    ],
    artists: [
      'E2E Test Artist',
      'My Test Artist',      // Add your artist
    ],
  },
};
```

### Adding New Data Types

When adding cleanup for new entities, follow this pattern:

```typescript
// 1. Add test patterns
const TEST_PATTERNS = {
  // ... existing patterns
  myNewEntity: {
    titles: [
      /^E2E MyEntity \d+/,
      /^Test MyEntity \d+/,
    ],
  },
};

// 2. Create cleanup function
export async function cleanupTestMyEntities(): Promise<{ deleted: number; errors: any[] }> {
  const supabase = getSupabaseClient();
  let deleted = 0;
  const errors: any[] = [];

  try {
    const { data: entities, error: fetchError } = await supabase
      .from('my_entities')
      .select('id, title');

    if (fetchError) {
      console.error('Error fetching my entities for cleanup:', fetchError);
      errors.push(fetchError);
      return { deleted, errors };
    }

    if (!entities || entities.length === 0) {
      console.log('No my entities found for cleanup');
      return { deleted, errors };
    }

    const testEntities = entities.filter(entity =>
      matchesPattern(entity.title, TEST_PATTERNS.myNewEntity.titles)
    );

    console.log(`Found ${testEntities.length} test my entities to delete`);

    for (const entity of testEntities) {
      const { error: deleteError } = await supabase
        .from('my_entities')
        .delete()
        .eq('id', entity.id);

      if (deleteError) {
        console.error(`Error deleting my entity ${entity.id}:`, deleteError);
        errors.push({ entity, error: deleteError });
      } else {
        deleted++;
        console.log(`Deleted test my entity: ${entity.title}`);
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error('Unexpected error during my entity cleanup:', error);
    errors.push(error);
    return { deleted, errors };
  }
}

// 3. Add to cleanupAllTestData
export async function cleanupAllTestData(): Promise<void> {
  console.log('\n🧹 Starting test data cleanup...\n');

  const results = {
    // ... existing cleanups
    myEntities: await cleanupTestMyEntities(),
  };

  console.log('\n📊 Cleanup Summary:');
  // ... existing logging
  console.log(`  My Entities deleted: ${results.myEntities.deleted}`);

  // Update total errors calculation
}
```

**Important**: Consider deletion order based on foreign key constraints. Delete child records before parent records to avoid constraint violations.

## Configuration

### Environment Variables

Cleanup uses these environment variables from `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY=your-anon-key
# or
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Playwright Config

Configured in `playwright.config.ts`:

```typescript
export default defineConfig({
  // ...
  globalTeardown: './tests/global-teardown.ts',
  // ...
});
```

## Troubleshooting

### Cleanup not running

**Symptoms**: Test data remains after tests complete

**Solutions**:
1. Verify global teardown is configured in `playwright.config.ts`
2. Check test process completed normally (not killed/interrupted)
3. Run manual cleanup: `npm run test:cleanup`
4. Check console output for cleanup logs

### Environment variable errors

**Symptoms**: `Missing Supabase credentials for cleanup`

**Solutions**:
1. Verify `.env.local` has Supabase credentials
2. Check environment variables are loaded
3. Ensure Supabase local instance is running
4. Verify credentials are correct

### Pattern matching issues

**Symptoms**: Some test data not deleted

**Solutions**:
1. Check test data matches patterns in `cleanup.ts`
2. Add console.log in cleanup to debug pattern matching
3. Update patterns to match your test data format
4. Run manual cleanup to see detailed logging

### Permission errors

**Symptoms**: Database permission errors during cleanup

**Solutions**:
1. Ensure you're using admin/service role key
2. Check RLS policies allow deletion
3. Verify Supabase client configuration
4. Use service role key if anon key doesn't have permissions

## Best Practices

1. **Always use timestamps**: Ensures unique test data and prevents conflicts
   ```typescript
   const timestamp = Date.now();
   const testSong = { title: `E2E Song ${timestamp}` };
   ```

2. **Follow established patterns**: Use existing naming conventions for automatic cleanup

3. **Run cleanup after failed tests**: If tests fail, run `npm run test:cleanup`

4. **Monitor cleanup logs**: Check that cleanup is working in CI/CD pipelines

5. **Keep patterns updated**: Add new test patterns to cleanup config as needed

## CI/CD Integration

Cleanup runs automatically in CI/CD pipelines after Playwright tests:

```yaml
# .github/workflows/test.yml example
- name: Run E2E Tests
  run: npm run playwright:run
  # Cleanup runs automatically via globalTeardown
```

If you need explicit cleanup in CI:

```yaml
- name: Run E2E Tests
  run: npm run playwright:run

- name: Cleanup Test Data
  if: always()  # Run even if tests fail
  run: npm run test:cleanup
```

## Comprehensive Coverage

The cleanup system now covers:
- ✅ Songs and song metadata
- ✅ Lessons
- ✅ Assignments and assignment templates
- ✅ Users (profiles) with cascade deletion
- ✅ Pending students
- ✅ Practice sessions (via cascade and orphan cleanup)
- ✅ Student song progress (via cascade and orphan cleanup)
- ✅ AI conversations and messages
- ✅ Automatic execution after test runs
- ✅ Manual cleanup script
- ✅ Detailed logging and error reporting

## Future Improvements

Consider adding:
- [ ] Cleanup before tests (global setup)
- [ ] Age-based cleanup (delete test data older than X days)
- [ ] Cleanup for specific test patterns only
- [ ] Cleanup statistics/reporting dashboard
- [ ] Integration with CI/CD reporting
- [ ] Dry-run mode to preview what would be deleted
- [ ] Backup test data before cleanup
- [ ] Selective cleanup by entity type (e.g., only clean songs)
