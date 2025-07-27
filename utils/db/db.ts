/// <reference lib="deno.unstable" />

/**
 * Database Utility Module for Barsistant
 *
 * This module provides a centralized Deno KV connection and helper functions
 * for interacting with the database. It ensures a single connection instance
 * is used throughout the application and provides error handling.
 *
 * Key Structure Patterns (ULID-based for chronological sorting):
 *
 * Recipe storage with namespace separation:
 * - User recipes: ["user_recipe", userId, ulid] → full recipe data
 * - Public recipes: ["public_recipe", ulid] → full recipe data
 *
 * Core entities:
 * - Ingredients: ["ingredient", ingredientId] → ingredient data
 *
 * Benefits:
 * - ULID keys enable natural chronological ordering
 * - Efficient kv.list() operations with prefix filtering
 * - Clear namespace separation between user and public recipes
 * - Single Recipe type for all use cases
 */

// Import the Deno KV types directly from the Deno namespace
type Kv = Deno.Kv;

// ULID-based key patterns for chronological ordering
// Note: When a recipe is made public, it uses the same ULID in both namespaces
export type UserRecipeKey = ["user_recipe", string, string]; // [prefix, userId, ulid]
export type PublicRecipeKey = ["public_recipe", string]; // [prefix, ulid]

// Ingredient index keys for efficient querying
export type IngredientKey = ["ingredient", string];
export type IngredientTypeKey = ["ingredient_type", string, string]; // [prefix, type, ingredientId]
export type IngredientSearchKey = ["ingredient_search", string, string]; // [prefix, term, ingredientId]
export type IngredientAllergenKey = ["ingredient_allergen", string, string]; // [prefix, allergen, ingredientId]

// Authentication system keys
export type UserKey = ["users", string]; // [prefix, userId]
export type UserEmailKey = ["user_emails", string]; // [prefix, email]
export type AuthTokenKey = ["auth_tokens", string]; // [prefix, token]
export type AuthCodeKey = ["auth_codes", string]; // [prefix, code]
export type AuthCodeEmailKey = ["auth_code_email", string]; // [prefix, email] -> codes[]
export type UserSessionKey = ["user_sessions", string]; // [prefix, sessionId]
export type UserSessionLookupKey = ["user_session_lookup", string, string]; // [prefix, userId, sessionId]

// System and utility keys
export type RateLimitKey = ["rate_limit", string, string]; // [prefix, limitType, identifier]
export type DbVersionKey = ["db_meta", "version"]; // [prefix, "version"]
export type HealthCheckKey = ["__health_check__"]; // Special health check key

// Error class for database operations
export class DatabaseError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = "DatabaseError";
  }
}

/**
 * Connection retry configuration
 */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

let _kv: Kv | null = null;

/**
 * Initializes the database connection with error handling and retry logic
 *
 * @returns A Promise that resolves to the KV instance
 * @throws {DatabaseError} If the database connection fails after retries
 */
async function initKv(): Promise<Kv> {
  let lastError: unknown = null;
  let retryCount = 0;

  // Support remote KV URL via environment variable
  const kvUrl = Deno.env.get("DENO_KV_URL");

  while (retryCount < MAX_RETRIES) {
    try {
      // Use remote URL if provided, otherwise default to local
      const kv = kvUrl ? await Deno.openKv(kvUrl) : await Deno.openKv();

      // Test the connection with a simple operation
      const healthCheckKey: HealthCheckKey = ["__health_check__"];
      await kv.get(healthCheckKey);

      return kv;
    } catch (error) {
      lastError = error;
      retryCount++;

      // Exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error(
    "Failed to initialize database connection after retries:",
    lastError,
  );
  throw new DatabaseError(
    "Failed to initialize database connection",
    lastError,
  );
}

/**
 * Returns the Deno KV instance, creating it if it doesn't exist.
 * This ensures a single connection is reused throughout the application.
 *
 * @returns The KV instance
 * @throws {DatabaseError} If the database connection fails
 */
export async function getKv(): Promise<Kv> {
  if (!_kv) {
    _kv = await initKv();
  }
  return _kv;
}

/**
 * A singleton instance of the KV database.
 * This is lazily initialized when first accessed.
 *
 * For most use cases, use this exported instance rather than calling getKv().
 * Only use getKv() directly when you need to ensure the connection is ready.
 */
export const kv = await getKv().catch((error) => {
  console.error("Failed to initialize KV database:", error);
  throw new DatabaseError("Failed to initialize KV database on startup", error);
});

/**
 * Safely executes a database operation with error handling
 *
 * @param operation - Function that performs a database operation
 * @param errorMessage - Custom error message if the operation fails
 * @returns The result of the database operation
 * @throws {DatabaseError} If the operation fails
 */
export async function executeDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Checks if the database is healthy and accessible
 *
 * @returns A Promise that resolves to a boolean indicating database health
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    const db = await getKv();
    const healthCheckKey: HealthCheckKey = ["__health_check__"];
    await db.get(healthCheckKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Closes the database connection if it exists
 * This should typically be called when shutting down the application
 */
export async function closeDatabase(): Promise<void> {
  if (_kv) {
    try {
      await _kv.close();
      _kv = null;
    } catch (error) {
      console.error("Error closing database connection:", error);
    }
  }
}

/**
 * Get a Deno.KvListIterator for a given prefix, limit, and cursor.
 */
export function getKvIterator<T>(
  kv: Kv,
  prefix: Deno.KvKeyPart[],
  limit: number,
  cursor?: string,
): Deno.KvListIterator<T> {
  const optionsArg = cursor ? { limit, cursor } : { limit };
  return kv.list<T>({ prefix }, optionsArg);
}

/**
 * Process a Deno.KvListIterator and return items and the next cursor.
 */
export async function processKvIterator<T>(
  iterator: Deno.KvListIterator<T>,
): Promise<{ cursor: string; items: T[] }> {
  const items: T[] = [];
  let cursor = "";
  for await (const entry of iterator) {
    items.push(entry.value as T);
    cursor = iterator.cursor;
  }
  return { cursor, items };
}
