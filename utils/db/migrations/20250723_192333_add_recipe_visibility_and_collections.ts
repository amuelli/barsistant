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
import type { Recipe } from "../../../types/recipe.ts";

/**
 * Migration metadata and implementation
 */
export const migration: Migration = {
  // Metadata (automatically extracted from filename, but can be customized)
  name: "add_recipe_visibility_and_collections", // Will be extracted from filename
  timestamp: "20250723_192333", // Will be extracted from filename

  // Migration information
  description:
    "Add recipe visibility field and public recipe indexes for recipe privacy system",
  isDangerous: false, // No data loss, only adds fields and indexes

  /**
   * Apply the migration
   *
   * @returns Promise resolving to true if successful
   * @throws Error if the migration fails (will be caught by runner for rollback)
   */
  async up() {
    const kv = await getKv();

    try {
      console.log("Running migration: add_recipe_visibility_and_collections");

      let updateCount = 0;
      let publicIndexCount = 0;

      // Get all existing recipes and set them as public for backward compatibility
      for await (const entry of kv.list<Recipe>({ prefix: ["recipe"] })) {
        const recipe = entry.value;

        // Only update recipes that don't have visibility set
        if (!recipe.visibility) {
          const updatedRecipe = {
            ...recipe,
            visibility: "public", // Set existing recipes as public for backward compatibility
          };

          // Start transaction for atomic update
          const transaction = kv.atomic();

          // Update the recipe with visibility field
          transaction.set(["recipe", recipe.id], updatedRecipe);

          // Add to public recipes index
          transaction.set(["public_recipes", recipe.id], true);

          // Commit transaction
          const result = await transaction.commit();

          if (result.ok) {
            updateCount++;
            publicIndexCount++;
          } else {
            console.error(`Failed to update recipe ${recipe.id}`);
          }
        }
      }

      console.log(
        `Migration completed: Updated ${updateCount} recipes to public visibility`,
      );
      console.log(`Added ${publicIndexCount} entries to public recipes index`);

      return true;
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
      console.log(
        "Rolling back migration: add_recipe_visibility_and_collections",
      );

      let removeCount = 0;

      // Remove visibility field from all recipes and clean up public index
      for await (const entry of kv.list<Recipe>({ prefix: ["recipe"] })) {
        const recipe = entry.value;

        if (recipe.visibility) {
          // Remove visibility field
          const { visibility: _, ...recipeWithoutVisibility } = recipe;

          // Start transaction
          const transaction = kv.atomic();

          // Update recipe without visibility field
          transaction.set(["recipe", recipe.id], recipeWithoutVisibility);

          // Remove from public recipes index
          transaction.delete(["public_recipes", recipe.id]);

          const result = await transaction.commit();

          if (result.ok) {
            removeCount++;
          } else {
            console.error(`Failed to rollback recipe ${recipe.id}`);
          }
        }
      }

      console.log(
        `Rollback completed: Removed visibility from ${removeCount} recipes`,
      );

      return true; // Return true if rollback succeeds
    } catch (error) {
      console.error(`Rollback of '${this.name}' failed:`, error);
      throw error;
    }
  },
};

// Export the migration as default for easier importing
export default migration;
