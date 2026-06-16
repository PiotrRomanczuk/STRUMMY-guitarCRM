import { NextRequest, NextResponse } from 'next/server';
import { dbRouter } from '@/lib/api/database-router';
import { db, unifiedDB } from '@/lib/api/unified-db';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

/**
 * Database Status API
 *
 * Provides information about the current database connection
 * and tests connectivity to both local and remote endpoints.
 *
 * Requires bearer token authentication via API key.
 */

export async function GET(request: NextRequest) {
  return withApiAuth(request, async () => {
    try {
      const dbInfo = unifiedDB.getDatabaseInfo();

      // Test current database connectivity
      const healthCheck = await dbRouter.get('/songs', { limit: '1' });

      // Get some basic stats
      const [songsCount, lessonsCount, profilesCount] = await Promise.all([
        db.songs.count().catch(() => ({ data: 0, error: 'Unable to count' })),
        db.lessons.count().catch(() => ({ data: 0, error: 'Unable to count' })),
        db.profiles.count().catch(() => ({ data: 0, error: 'Unable to count' })),
      ]);

      return NextResponse.json({
        database: {
          type: dbInfo.isLocal ? 'local' : 'remote',
          baseUrl: dbInfo.baseUrl,
          status: healthCheck.error ? 'error' : 'connected',
          error: healthCheck.error?.message || null,
        },
        statistics: {
          songs: songsCount.data,
          lessons: lessonsCount.data,
          profiles: profilesCount.data,
        },
        connectivity: {
          current_database: dbInfo.isLocal ? 'local' : 'remote',
          health_check_status: healthCheck.status,
          response_time: Date.now(), // You could measure actual response time
        },
        environment: {
          node_env: process.env.NODE_ENV,
          has_local_config: !!(
            process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL &&
            process.env.NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY
          ),
          has_remote_config: !!(
            process.env.NEXT_PUBLIC_SUPABASE_REMOTE_URL &&
            process.env.NEXT_PUBLIC_SUPABASE_REMOTE_ANON_KEY
          ),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ [Database Status] Error:', error);
      return NextResponse.json(
        {
          error: 'Failed to get database status',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withApiAuth(request, async () => {
    try {
      const body = await request.json();

      if (body.action === 'refresh') {
        // Refresh the database connection
        unifiedDB.refreshConnection();

        return NextResponse.json({
          message: 'Database connection refreshed',
          database: unifiedDB.getDatabaseInfo(),
          timestamp: new Date().toISOString(),
        });
      }

      if (body.action === 'test') {
        // Test specific operations
        const testResults = await Promise.all([
          // Test read operation
          db.songs.findAll({ limit: 1 }).then((r) => ({
            operation: 'read',
            success: !r.error,
            error: r.error?.message,
          })),

          // Test RPC operation
          db.rpc.isAdmin().then((r) => ({
            operation: 'rpc',
            success: !r.error,
            error: r.error?.message,
          })),
        ]);

        return NextResponse.json({
          test_results: testResults,
          database: unifiedDB.getDatabaseInfo(),
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json(
        { error: 'Invalid action. Supported actions: refresh, test' },
        { status: 400 }
      );
    } catch (error) {
      logger.error('❌ [Database Status] POST Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
