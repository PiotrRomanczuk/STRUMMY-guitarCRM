/**
 * Database Module Index
 *
 * Centralized exports for the database layer.
 * Import from '@/lib/database' to access all database utilities.
 */

// Connection layer - for config and utilities
export {
  DatabaseConnection,
  getDatabaseConfig,
  hasLocalConfig,
  hasRemoteConfig,
  getDatabasePreference,
  getSupabaseHeaders,
  getAdminHeaders,
  buildRestUrl,
  buildAuthUrl,
  buildStorageUrl,
  testConnection,
  logDbOperation,
  getLogPrefix,
  type DatabaseType,
  type DatabaseConfig,
  type ConnectionStatus,
  type DatabasePreference,
} from './connection';

// Middleware layer - for API routes and server components
export {
  DatabaseMiddleware,
  detectDatabasePreference,
  detectDatabasePreferenceFromCookies,
  createRoutedSupabaseClient,
  createRoutedServerClient,
  createRoutedAdminClient,
  addDatabaseHeaders,
  logDatabaseOperation,
  type DatabaseContext,
  type RequestDatabaseInfo,
} from './middleware';

// Query helpers - shared utilities for Supabase query building
export {
  applySortAndPagination,
  type SupabaseQueryBuilder,
} from './query-helpers';
