/**
 * Migration Template
 * -----------------
 *
 * This is a template for database migrations. Copy this file and rename it using
 * the following format: YYYYMMDD_HHMMSS_migration_name.ts
 *
 * For example: 20250708_140000_add_user_favorites.ts
 *
 * Instructions:
 * 1. Copy this file with the correct timestamp and descriptive name
 * 2. Implement the up() and down() functions
 * 3. Fill in the description
 * 4. Set isDangerous flag if the migration contains destructive operations
 */

import { getKv } from "../db.ts";
import { type Migration } from "./types.ts";

/**
 * Migration metadata and implementation
 */
export const migration: Migration = {
  // Metadata (automatically extracted from filename, but can be customized)
  name: "migration_name", // Will be extracted from filename
  timestamp: "YYYYMMDD_HHMMSS", // Will be extracted from filename

  // Migration information
  description: "Description of what this migration does",
  isDangerous: false, // Set to true if migration has potential for data loss

  /**
   * Apply the migration
   *
   * @returns Promise resolving to true if successful
   * @throws Error if the migration fails (will be caught by runner for rollback)
   */
  async up() {
    const kv = await getKv();

    try {
      // Implementation of the migration
      // For example:
      // await kv.set(["example", "key"], { value: "example" });

      // For atomic operations, use transactions:
      // const result = await kv.atomic()
      //   .set(["key1"], "value1")
      //   .set(["key2"], "value2")
      //   .commit();
      // if (!result.ok) throw new Error("Transaction failed");

      return true; // Return true if migration succeeds
    } catch (error) {
      console.error(`Migration '${this.name}' failed:`, error);
      throw error; // Rethrow to trigger rollback if needed
    }
  },

  /**
   * Revert the migration
   *
   * @returns Promise resolving to true if successful
   * @throws Error if the rollback fails
   */
  async down() {
    const kv = await getKv();

    try {
      // Implementation to undo the migration
      // For example:
      // await kv.delete(["example", "key"]);

      return true; // Return true if rollback succeeds
    } catch (error) {
      console.error(`Rollback of '${this.name}' failed:`, error);
      throw error;
    }
  },
};

// Export the migration as default for easier importing
export default migration;
