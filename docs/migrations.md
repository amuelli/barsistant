# Database Migration System

This document describes the database migration system for Barsistant.

## Overview

The migration system allows for versioned changes to the database schema and
data. It:

1. Automatically runs pending migrations on application startup (configurable)
2. Tracks which migrations have been applied in the database
3. Executes migrations in order by timestamp
4. Supports rollbacks for failed migrations
5. Provides CLI tools for migration management

## Creating Migrations

To create a new migration:

```bash
deno run -A scripts/generate-migration.ts migration_name "Description of the migration"
```

This will create a new file in `utils/db/migrations/` with the format
`YYYYMMDD_HHMMSS_migration_name.ts`.

## Migration File Structure

Each migration consists of:

1. Metadata (name, timestamp, description, isDangerous flag)
2. `up()` function to apply the migration
3. `down()` function to roll back the migration

Example:

```typescript
import { type Migration } from "./types.ts";
import { getKv } from "../db.ts";

export const migration: Migration = {
  name: "add_user_favorites_index",
  timestamp: "20250708_000001",

  description: "Add secondary index for user favorites",
  isDangerous: false,

  async up() {
    const kv = await getKv();
    // Implementation...
    return true;
  },

  async down() {
    const kv = await getKv();
    // Rollback implementation...
    return true;
  },
};

export default migration;
```

## Managing Migrations

The system provides a CLI tool for managing migrations:

```bash
# Show migration status
deno run -A scripts/migrations.ts status

# Run pending migrations
deno run -A scripts/migrations.ts run

# Run pending migrations in dry run mode (no actual changes)
deno run -A scripts/migrations.ts run --dry-run

# Approve a dangerous migration for production
deno run -A scripts/migrations.ts approve migration_name

# Roll back a specific migration (not yet implemented)
deno run -A scripts/migrations.ts rollback migration_name
```

## Configuration

The migration system can be configured using environment variables:

- `DISABLE_MIGRATIONS`: Set to "true" to completely disable migrations
- `AUTO_MIGRATE`: Set to "true" or "false" to control automatic migration on
  startup
- `ROLLBACK_ON_ERROR`: Set to "true" or "false" to control automatic rollback on
  error
- `APPROVED_DANGEROUS_MIGRATIONS`: Comma-separated list of dangerous migration
  names approved for production

## Dangerous Migrations

Migrations that could potentially cause data loss should be marked with
`isDangerous: true`. These migrations:

1. Will run normally in development environments
2. Will require explicit approval in production
3. Can be approved using the CLI tool or by setting the
   `APPROVED_DANGEROUS_MIGRATIONS` env var

## Production Deployment

In production environments:

1. Migrations do not run automatically by default (can be enabled with
   `AUTO_MIGRATE=true`)
2. Dangerous migrations require explicit approval
3. Migrations are not automatically rolled back on error (can be enabled with
   `ROLLBACK_ON_ERROR=true`)

For CI/CD pipelines, you may want to:

1. Run migrations as a separate step before deploying the application
2. Use the `--dry-run` flag to check what migrations would be applied
3. Pre-approve any dangerous migrations that are required

## Error Handling

If a migration fails:

1. The error is logged with context
2. The migration is marked as failed in the database
3. If `rollbackOnError` is true, the system attempts to roll back the failed
   migration
4. If `stopOnError` is true, no further migrations will be run

## Testing

To run the migration system tests:

```bash
deno task test utils/db/migrations_test.ts
```
