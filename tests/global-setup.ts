/**
 * Playwright globalSetup — seeds the test accounts once before any spec runs.
 *
 * Idempotent: existing users are left alone, missing users are created.
 * Wires into playwright.config.ts → globalSetup. Failures here abort the run
 * loud instead of letting every spec fail with confusing auth errors.
 */

import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { seedTestAccounts } from './helpers/helpers/seed';

dotenv.config({ path: 'tests/.env.e2e' });
dotenv.config({ path: '.env.local' });

export default async function globalSetup(): Promise<void> {
  // Hard-fail if PLAYWRIGHT_USE_LOCAL_SUPABASE=1 but local Supabase is down.
  if (process.env.PLAYWRIGHT_USE_LOCAL_SUPABASE === '1') {
    try {
      execSync('nc -z 127.0.0.1 54321', { timeout: 2000, stdio: 'ignore' });
    } catch {
      throw new Error(
        '[globalSetup] PLAYWRIGHT_USE_LOCAL_SUPABASE=1 but local Supabase is not running on 54321. Run `supabase start` first.'
      );
    }
  }

  const ids = await seedTestAccounts();
  // Expose the ids to specs that need cross-role data.
  process.env.E2E_ADMIN_ID = ids.admin;
  process.env.E2E_TEACHER_ID = ids.teacher;
  process.env.E2E_STUDENT_ID = ids.student;

  // Telemetry: only print on first run, not retries.
  console.log(
    `[globalSetup] seeded admin/${ids.admin?.slice(0, 8)}, teacher/${ids.teacher?.slice(0, 8)}, student/${ids.student?.slice(0, 8)}`
  );
}
