/**
 * Migration to regenerate all recipe images
 */

import { getKv } from "../db.ts";
import { type Migration } from "./types.ts";

/**
 * Migration metadata and implementation
 */
export const migration: Migration = {
  name: "regenerate_images",
  timestamp: "20250708_192213",
  description: "Regenerate all raster and vector images",
  isDangerous: false, // Set to true if migration has potential for data loss

  /**
   * Queue jobs to regenerate raster images for all recipes
   */
  async up() {
    const kv = await getKv();
    try {
      console.log(
        "Starting migration: Queueing raster image generation for all recipes",
      );

      // Track statistics for logging
      let recipeCount = 0;
      let successCount = 0;
      let errorCount = 0;
      const failedRecipeIds: string[] = [];

      // Import the enqueueJob function
      const { enqueueJob } = await import("../queue-handler.ts");

      // Get all recipes from the database
      for await (
        const entry of kv.list<Record<string, unknown>>({ prefix: ["recipe"] })
      ) {
        const recipeId = entry.key[1] as string;
        recipeCount++;

        try {
          // Enqueue a job to regenerate the raster image for this recipe
          await enqueueJob({
            type: "generate_recipe_raster_image",
            recipeId,
          });

          successCount++;

          // Log progress for every 10 recipes
          if (successCount % 10 === 0) {
            console.log(
              `Progress: ${successCount}/${recipeCount} recipes queued for image regeneration`,
            );
          }
        } catch (err) {
          errorCount++;
          failedRecipeIds.push(recipeId);
          console.error(
            `Failed to queue job for recipe ${recipeId}:`,
            err instanceof Error ? err.message : String(err),
          );
        }
      }

      // Log summary
      console.log(`
        Migration complete: Regenerate images
        --------------------------------------
        Total recipes processed: ${recipeCount}
        Successfully queued: ${successCount}
        Failed to queue: ${errorCount}
        ${
        errorCount > 0 ? `Failed recipe IDs: ${failedRecipeIds.join(", ")}` : ""
      }
      `);

      return true; // Return true if migration succeeds
    } catch (error) {
      console.error(
        `Migration '${this.name}' failed:`,
        error instanceof Error ? error.message : String(error),
      );
      throw error; // Rethrow to trigger rollback if needed
    }
  },

  /**
   * No-op rollback since image regeneration is non-destructive
   */
  down() {
    // There's no destructive change to roll back for this migration.
    // The image regeneration jobs have been queued, and they will either:
    // 1. Complete successfully (which is fine)
    // 2. Fail and be retried (which is handled by the queue system)
    // 3. Never be processed (which is also fine as it doesn't affect data integrity)

    console.log(
      "Rollback for regenerate_images: This is a non-destructive migration with no specific rollback actions needed.",
    );

    return Promise.resolve(true); // Return true since there's nothing specific to roll back
  },
};

// Export the migration as default for easier importing
export default migration;
