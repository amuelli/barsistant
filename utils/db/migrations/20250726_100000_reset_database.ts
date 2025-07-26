/**
 * Reset Database
 * --------------
 *
 * This migration completely resets the database by deleting ALL data.
 * This is a destructive operation that removes everything.
 *
 * WARNING: This will delete ALL data including:
 * - All recipes (user and public)
 * - All users and authentication data
 * - All ingredients
 * - All user data (favorites, inventory, notes, etc.)
 * - All system metadata
 */

import { getKv } from "../db.ts";
import { type Migration } from "./types.ts";

/**
 * Reset database migration
 */
export const migration: Migration = {
  name: "reset_database",
  timestamp: "20250726_100000",
  description: "Complete database reset - deletes ALL data",
  isDangerous: true, // This migration deletes ALL data

  /**
   * Delete all data from the database
   */
  async up() {
    const kv = await getKv();

    try {
      console.log("🚨 Starting complete database reset...");
      console.log("⚠️  WARNING: This will delete ALL data!");

      let count = 0;

      // Get all entries in the database
      const allEntries = await Array.fromAsync(kv.list({ prefix: [] }));

      console.log(`Found ${allEntries.length} total entries to delete`);

      // Delete all entries
      for (const entry of allEntries) {
        await kv.delete(entry.key);
        count++;

        // Log progress every 100 entries
        if (count % 100 === 0) {
          console.log(
            `Progress: ${count}/${allEntries.length} entries deleted`,
          );
        }
      }

      console.log(`
🗑️  Database reset completed
---------------------------
Total entries deleted: ${count}

The database is now completely empty.
      `);

      return true;
    } catch (error) {
      console.error(`Migration '${this.name}' failed:`, error);
      throw error;
    }
  },

  /**
   * Cannot restore deleted data
   */
  down() {
    console.warn(
      "⚠️  Cannot rollback database reset - all data is permanently removed",
    );
    console.warn("To restore data, you would need to restore from a backup");

    // Return true since we can't actually rollback deletions
    return Promise.resolve(true);
  },
};

// Export the migration as default for easier importing
export default migration;
