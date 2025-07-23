/// <reference lib="deno.unstable" />

/**
 * User Collection model implementation for the Barsistant application
 *
 * This module provides CRUD operations for user recipe collections,
 * managing both owned recipes and saved public recipes.
 */

import type { Recipe } from "../../types/recipe.ts";
import type { UserCollection, UserCollectionType } from "../../types/user.ts";
import { executeDbOperation, kv } from "./db.ts";
import { recipeModel } from "./recipe-model.ts";

/**
 * User collection model with CRUD operations
 */
export const userCollectionModel = {
  /**
   * Add a recipe to a user's collection
   *
   * @param userId User ID
   * @param recipeId Recipe ID
   * @param collectionType Type of collection entry (owned or saved)
   * @param notes Optional notes about the recipe
   * @returns The created collection entry
   * @throws {DatabaseError} If the database operation fails
   */
  async addToCollection(
    userId: string,
    recipeId: string,
    collectionType: UserCollectionType,
    notes?: string,
  ): Promise<UserCollection> {
    return await executeDbOperation(async () => {
      const now = new Date().toISOString();

      const collection: UserCollection = {
        userId,
        recipeId,
        addedAt: now,
        collectionType,
        notes,
      };

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Add the collection entry
      transaction.set(["user_collections", userId, recipeId], collection);

      // Commit transaction
      const result = await transaction.commit();

      if (!result.ok) {
        throw new Error(
          `Failed to add recipe to collection: ${result.toString()}`,
        );
      }

      return collection;
    }, `Failed to add recipe ${recipeId} to user ${userId} collection`);
  },

  /**
   * Remove a recipe from a user's collection
   *
   * @param userId User ID
   * @param recipeId Recipe ID
   * @returns True if successfully removed, false if not found
   * @throws {DatabaseError} If the database operation fails
   */
  async removeFromCollection(
    userId: string,
    recipeId: string,
  ): Promise<boolean> {
    return await executeDbOperation(async () => {
      // Check if the collection entry exists
      const existing = await kv.get<UserCollection>([
        "user_collections",
        userId,
        recipeId,
      ]);

      if (!existing.value) {
        return false;
      }

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Remove the collection entry
      transaction.delete(["user_collections", userId, recipeId]);

      // Commit transaction
      const result = await transaction.commit();

      if (!result.ok) {
        throw new Error(
          `Failed to remove recipe from collection: ${result.toString()}`,
        );
      }

      return true;
    }, `Failed to remove recipe ${recipeId} from user ${userId} collection`);
  },

  /**
   * Check if a recipe is in a user's collection
   *
   * @param userId User ID
   * @param recipeId Recipe ID
   * @returns The collection entry if found, null otherwise
   * @throws {DatabaseError} If the database operation fails
   */
  async getCollectionEntry(
    userId: string,
    recipeId: string,
  ): Promise<UserCollection | null> {
    return await executeDbOperation(
      async () => {
        const result = await kv.get<UserCollection>([
          "user_collections",
          userId,
          recipeId,
        ]);
        return result.value;
      },
      `Failed to check collection entry for recipe ${recipeId} and user ${userId}`,
    );
  },

  /**
   * Check if a recipe is in a user's collection (boolean helper)
   *
   * @param userId User ID
   * @param recipeId Recipe ID
   * @returns True if recipe is in user's collection
   * @throws {DatabaseError} If the database operation fails
   */
  async isInUserCollection(
    userId: string,
    recipeId: string,
  ): Promise<boolean> {
    const entry = await this.getCollectionEntry(userId, recipeId);
    return entry !== null;
  },

  /**
   * Get a user's complete recipe collection (owned + saved recipes)
   *
   * @param userId User ID
   * @param limit Maximum number of recipes to return
   * @param offset Number of recipes to skip
   * @returns Array of recipes in the user's collection
   * @throws {DatabaseError} If the database operation fails
   */
  async getUserCollection(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const recipes: Recipe[] = [];
      let count = 0;

      for await (
        const entry of kv.list<UserCollection>({
          prefix: ["user_collections", userId],
        })
      ) {
        if (count >= offset && recipes.length < limit) {
          const recipeId = entry.key[2] as string;
          const recipe = await recipeModel.getById(recipeId);

          if (recipe) {
            recipes.push(recipe);
          }
        }
        count++;

        if (recipes.length >= limit) {
          break;
        }
      }

      return recipes;
    }, `Failed to get collection for user ${userId}`);
  },

  /**
   * Get recipes in a user's collection by type (owned or saved)
   *
   * @param userId User ID
   * @param collectionType Type of recipes to get
   * @param limit Maximum number of recipes to return
   * @param offset Number of recipes to skip
   * @returns Array of recipes of the specified type
   * @throws {DatabaseError} If the database operation fails
   */
  async getUserCollectionByType(
    userId: string,
    collectionType: UserCollectionType,
    limit = 20,
    offset = 0,
  ): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const recipes: Recipe[] = [];
      let count = 0;

      for await (
        const entry of kv.list<UserCollection>({
          prefix: ["user_collections", userId],
        })
      ) {
        const collection = entry.value;
        if (collection.collectionType === collectionType) {
          if (count >= offset && recipes.length < limit) {
            const recipeId = entry.key[2] as string;
            const recipe = await recipeModel.getById(recipeId);

            if (recipe) {
              recipes.push(recipe);
            }
          }
          count++;

          if (recipes.length >= limit) {
            break;
          }
        }
      }

      return recipes;
    }, `Failed to get ${collectionType} recipes for user ${userId}`);
  },

  /**
   * Toggle a recipe in a user's collection (add if not present, remove if present)
   *
   * @param userId User ID
   * @param recipeId Recipe ID
   * @param collectionType Type of collection entry (for adding)
   * @param notes Optional notes about the recipe (for adding)
   * @returns Object indicating the action taken and resulting collection entry
   * @throws {DatabaseError} If the database operation fails
   */
  async toggleInCollection(
    userId: string,
    recipeId: string,
    collectionType: UserCollectionType,
    notes?: string,
  ): Promise<
    { action: "added" | "removed"; collection: UserCollection | null }
  > {
    return await executeDbOperation(async () => {
      const existing = await this.getCollectionEntry(userId, recipeId);

      if (existing) {
        // Remove from collection
        await this.removeFromCollection(userId, recipeId);
        return { action: "removed", collection: null };
      } else {
        // Add to collection
        const collection = await this.addToCollection(
          userId,
          recipeId,
          collectionType,
          notes,
        );
        return { action: "added", collection };
      }
    }, `Failed to toggle recipe ${recipeId} in user ${userId} collection`);
  },

  /**
   * Get collection statistics for a user
   *
   * @param userId User ID
   * @returns Object with counts of owned and saved recipes
   * @throws {DatabaseError} If the database operation fails
   */
  async getCollectionStats(
    userId: string,
  ): Promise<{ owned: number; saved: number; total: number }> {
    return await executeDbOperation(async () => {
      let owned = 0;
      let saved = 0;

      for await (
        const entry of kv.list<UserCollection>({
          prefix: ["user_collections", userId],
        })
      ) {
        const collection = entry.value;
        if (collection.collectionType === "owned") {
          owned++;
        } else if (collection.collectionType === "saved") {
          saved++;
        }
      }

      return { owned, saved, total: owned + saved };
    }, `Failed to get collection stats for user ${userId}`);
  },

  /**
   * Sync owned recipes to user collections
   * This function ensures that all owned recipes are in the user's collection
   *
   * @param userId User ID
   * @returns Number of recipes synced
   * @throws {DatabaseError} If the database operation fails
   */
  async syncOwnedRecipes(userId: string): Promise<number> {
    return await executeDbOperation(async () => {
      let syncedCount = 0;

      // Get all recipes owned by the user
      const ownedRecipes = await recipeModel.getByUser(userId);

      for (const recipe of ownedRecipes) {
        // Check if already in collection
        const inCollection = await this.isInUserCollection(userId, recipe.id);

        if (!inCollection) {
          // Add to collection as owned
          await this.addToCollection(userId, recipe.id, "owned");
          syncedCount++;
        }
      }

      return syncedCount;
    }, `Failed to sync owned recipes for user ${userId}`);
  },
};
