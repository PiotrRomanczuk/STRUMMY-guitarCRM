'use server';

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import path from 'path';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

export async function performDatabaseBackup() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'Database backup is only available in development' };
    }

    const { isAdmin, isDevelopment } = await getUserWithRolesSSR();
    const guard = guardTestAccountMutation(isDevelopment);
    if (guard) return guard;

    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Only admins can perform backups' };
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'database', 'backup', 'backup-db.sh');

    if (!existsSync(scriptPath)) {
      return { success: false, error: 'Backup script not found' };
    }

    // Only pass environment variables the backup script actually needs
    const env = {
      PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
      HOME: process.env.HOME ?? '',
      NODE_ENV: process.env.NODE_ENV ?? 'development',
      POSTGRES_URL: process.env.POSTGRES_URL ?? '',
      SUPABASE_DB_URL: process.env.SUPABASE_DB_URL ?? '',
      BACKUP_DIR: process.env.BACKUP_DIR ?? '',
    } satisfies NodeJS.ProcessEnv;

    const { stderr } = await execAsync(`bash "${scriptPath}"`, {
      env,
      timeout: 60_000,
    });

    if (stderr) {
      logger.error('[backup] stderr output during backup');
    }

    return { success: true, message: 'Backup completed successfully' };
  } catch {
    return { success: false, error: 'Backup failed. Check server logs for details.' };
  }
}
