/**
 * Migration System Types
 *
 * This module defines the types used by the Barsistant database migration system.
 */

/**
 * Migration key pattern for storing migration metadata in Deno KV
 */
export type MigrationMetaKey = ["db_meta", "migrations", string];

/**
 * Migration approval key pattern for storing approval status of dangerous migrations
 */
export type MigrationApprovalKey = ["db_meta", "migration_approvals", string];

/**
 * Migration metadata stored in the database
 */
export interface MigrationRecord {
  name: string;
  timestamp: string;
  appliedAt: string;
  duration?: number; // in ms
  hash?: string; // hash of the migration content for integrity checks
}

/**
 * Migration status enum
 */
export type MigrationStatus =
  | "pending"
  | "applied"
  | "failed"
  | "skipped"
  | "rolled_back";

/**
 * Migration result returned by the runner
 */
export interface MigrationResult {
  name: string;
  status: MigrationStatus;
  appliedAt?: string;
  duration?: number;
  error?: Error;
  reason?: string;
}

/**
 * Migration options for controlling runner behavior
 */
export interface MigrationOptions {
  /**
   * Whether to stop running migrations if one fails
   * @default true
   */
  stopOnError?: boolean;

  /**
   * Whether to automatically run migrations on application startup
   * @default true in development, false in production
   */
  autoMigrate?: boolean;

  /**
   * Whether to attempt rollbacks on failed migrations
   * @default true
   */
  rollbackOnError?: boolean;

  /**
   * Whether to allow dangerous migrations in production
   * @default false
   */
  allowDangerousMigrations?: boolean;

  /**
   * Dry run mode - logs what would happen but does not apply migrations
   * @default false
   */
  dryRun?: boolean;
}

/**
 * Migration interface implemented by all migration files
 */
export interface Migration {
  /**
   * Migration name (typically extracted from filename)
   */
  name: string;

  /**
   * Migration timestamp (YYYYMMDD_HHMMSS format)
   */
  timestamp: string;

  /**
   * Description of what the migration does
   */
  description: string;

  /**
   * Whether this migration contains potentially destructive operations
   * that require special approval in production
   */
  isDangerous: boolean;

  /**
   * Apply the migration
   * @returns Promise resolving to true if successful
   * @throws Error if the migration fails
   */
  up: () => Promise<boolean>;

  /**
   * Revert the migration
   * @returns Promise resolving to true if successful
   * @throws Error if the rollback fails
   */
  down: () => Promise<boolean>;
}
