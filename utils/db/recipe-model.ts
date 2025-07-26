/// <reference lib="deno.unstable" />

/**
 * Recipe model implementation for the Barsistant application
 *
 * This module provides CRUD operations for recipes, managing both
 * primary records and related indexes.
 */

import { ulid } from "@std/ulid";
import { Recipe } from "../../types/recipe.ts";
import {
  executeDbOperation,
  getKvIterator,
  kv,
  processKvIterator,
} from "./db.ts";

/**
 * Recipe creation parameters
 */
export type CreateRecipeParams = Omit<Recipe, "id" | "createdAt" | "updatedAt">;

/**
 * Recipe update parameters (same as create but all fields optional)
 */
export type UpdateRecipeParams = Partial<CreateRecipeParams>;

/**
 * Recipe search parameters (simplified for in-memory filtering)
 */
export interface SearchRecipeParams {
  query?: string; // Name-based search only
  limit?: number;
  offset?: number;
}

/**
 * Recipe model with CRUD operations
 */
export const recipeModel = {
  /**
   * Create a new recipe
   *
   * @param params Recipe creation parameters
   * @returns The created recipe
   * @throws {DatabaseError} If the database operation fails
   */
  async create(params: CreateRecipeParams): Promise<Recipe> {
    return await executeDbOperation(async () => {
      // Validate inputs
      if (!params.name || params.name.trim() === "") {
        throw new Error("Recipe name is required");
      }

      if (
        !Array.isArray(params.ingredients) || params.ingredients.length === 0
      ) {
        throw new Error("At least one ingredient is required");
      }

      // Ensure every ingredient has a name
      for (const ingredient of params.ingredients) {
        if (!ingredient.name || ingredient.name.trim() === "") {
          throw new Error("Each ingredient must have a name");
        }
      }

      // Generate unique ID
      const id = ulid();
      const now = new Date().toISOString();

      // Create recipe object
      const recipe: Recipe = {
        id,
        name: params.name.trim(),
        description: params.description || "",
        ingredients: params.ingredients,
        garnish: params.garnish || [],
        glassware: params.glassware || "",
        preparation: params.preparation || [],
        source: params.source,
        tags: params.tags || [],
        createdBy: params.createdBy,
        visibility: params.visibility ?? "private", // Default to private
        originalRecipeId: params.originalRecipeId,
        publicRecipeId: params.publicRecipeId,
        createdAt: now,
        updatedAt: now,
      };

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Add the main recipe entry
      transaction.set(["recipe", id], recipe);

      // Add user-recipe index if recipe has a creator
      if (recipe.createdBy) {
        transaction.set(["user_recipes", recipe.createdBy, id], true);
      }

      // Add public recipe index if recipe is public
      if (recipe.visibility === "public") {
        transaction.set(["public_recipes", id], true);
      }

      // Commit transaction
      const result = await transaction.commit();

      if (!result.ok) {
        throw new Error(`Failed to create recipe: ${result.toString()}`);
      }

      return recipe;
    }, "Failed to create recipe");
  },

  /**
   * Get a recipe by ID
   *
   * @param id Recipe ID
   * @returns The recipe or null if not found
   * @throws {DatabaseError} If the database operation fails
   */
  async getById(id: string): Promise<Recipe | null> {
    return await executeDbOperation(async () => {
      const result = await kv.get<Recipe>(["recipe", id]);
      return result.value;
    }, "Failed to get recipe");
  },

  /**
   * Update an existing recipe
   *
   * @param id Recipe ID
   * @param params Update parameters
   * @returns The updated recipe
   * @throws {Error} If the recipe doesn't exist
   * @throws {DatabaseError} If the database operation fails
   */
  async update(id: string, params: UpdateRecipeParams): Promise<Recipe> {
    return await executeDbOperation(async () => {
      // Get existing recipe
      const result = await kv.get<Recipe>(["recipe", id]);

      if (!result.value) {
        throw new Error(`Recipe with ID ${id} not found`);
      }

      const existingRecipe = result.value;
      const now = new Date().toISOString();

      // If ingredients are being updated, ensure every ingredient has a name
      if (params.ingredients) {
        for (const ingredient of params.ingredients) {
          if (!ingredient.name || ingredient.name.trim() === "") {
            throw new Error("Each ingredient must have a name");
          }
        }
      }

      // Update recipe fields while preserving existing data
      const updatedRecipe: Recipe = {
        ...existingRecipe,
        ...params,
        id, // Ensure ID doesn't change
        updatedAt: now,
        createdAt: existingRecipe.createdAt, // Preserve creation date
        createdBy: params.createdBy !== undefined
          ? params.createdBy
          : existingRecipe.createdBy, // Handle createdBy updates
      };

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Add the main recipe entry
      transaction.set(["recipe", id], updatedRecipe);

      // Note: No need to update ingredient or tag indexes since we removed complex search

      // If createdBy changed, update user-recipe index
      if (
        params.createdBy !== undefined &&
        params.createdBy !== existingRecipe.createdBy
      ) {
        // Remove old user-recipe index if it existed
        if (existingRecipe.createdBy) {
          transaction.delete(["user_recipes", existingRecipe.createdBy, id]);
        }
        // Add new user-recipe index if new creator is set
        if (updatedRecipe.createdBy) {
          transaction.set(["user_recipes", updatedRecipe.createdBy, id], true);
        }
      }

      // If visibility changed, update public recipe index
      if (
        params.visibility !== undefined &&
        params.visibility !== existingRecipe.visibility
      ) {
        // Remove from public index if was public
        if (existingRecipe.visibility === "public") {
          transaction.delete(["public_recipes", id]);
        }
        // Add to public index if now public
        if (updatedRecipe.visibility === "public") {
          transaction.set(["public_recipes", id], true);
        }
      }

      // Commit transaction
      const result2 = await transaction.commit();

      if (!result2.ok) {
        throw new Error(`Failed to update recipe: ${result2.toString()}`);
      }

      return updatedRecipe;
    }, `Failed to update recipe ${id}`);
  },

  /**
   * Delete a recipe by ID and all related user data
   *
   * @param id Recipe ID
   * @returns True if successfully deleted, false if recipe not found
   * @throws {DatabaseError} If the database operation fails
   */
  async delete(id: string): Promise<boolean> {
    return await executeDbOperation(async () => {
      // Get existing recipe to remove all indexes
      const existingRecipe = (await kv.get<Recipe>(["recipe", id])).value;

      if (!existingRecipe) {
        return false;
      }

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Delete the main recipe entry
      transaction.delete(["recipe", id]);

      // Note: No need to delete ingredient or tag indexes since we removed complex search

      // Delete user-recipe index if recipe had a creator
      if (existingRecipe.createdBy) {
        transaction.delete(["user_recipes", existingRecipe.createdBy, id]);
      }

      // Delete public recipe index if recipe was public
      if (existingRecipe.visibility === "public") {
        transaction.delete(["public_recipes", id]);
      }

      // Delete all user favorites for this recipe
      for await (const entry of kv.list({ prefix: ["user_favorites"] })) {
        const key = entry.key as [string, string, string];
        if (key.length === 3 && key[2] === id) {
          transaction.delete(key);
        }
      }

      // Delete all user notes for this recipe
      for await (const entry of kv.list({ prefix: ["user_notes"] })) {
        const key = entry.key as [string, string, string];
        if (key.length === 3 && key[2] === id) {
          transaction.delete(key);
        }
      }

      // Commit transaction
      const result = await transaction.commit();

      if (!result.ok) {
        throw new Error(`Failed to delete recipe: ${result.toString()}`);
      }

      return true;
    }, `Failed to delete recipe ${id}`);
  },

  /**
   * List all recipes with optional pagination.
   *
   * @param limit Maximum number of recipes to return (optional; if not set, returns all)
   * @returns Array of recipes
   * @throws {DatabaseError} If the database operation fails
   */
  async listAll(limit?: number): Promise<Recipe[]> {
    // Use the paginated method to fetch all recipes if needed
    if (limit === undefined) {
      // Fetch all pages
      let cursor = "";
      let allRecipes: Recipe[] = [];
      do {
        const { items, cursor: nextCursor } = await recipeModel.listPage({
          limit: 100,
          cursor,
        });
        allRecipes = allRecipes.concat(items);
        cursor = nextCursor;
      } while (cursor !== "");
      return allRecipes;
    }

    // Return the first x entries (limit)
    return await executeDbOperation(async () => {
      const recipes: Recipe[] = [];
      for await (const entry of kv.list<Recipe>({ prefix: ["recipe"] })) {
        if (recipes.length < limit) {
          recipes.push(entry.value);
        } else {
          break;
        }
      }
      return recipes;
    }, "Failed to list recipes");
  },

  /**
   * List recipes with pagination support.
   * @param limit Number of recipes to return per page
   * @param cursor Cursor string from previous page (or empty string for first page)
   * @returns { items: Recipe[], cursor: string }
   */
  async listPage({
    limit = 30,
    cursor = "",
  }: {
    limit?: number;
    cursor?: string;
  }) {
    return await executeDbOperation(async () => {
      const iterator = getKvIterator<Recipe>(kv, ["recipe"], limit, cursor);
      return await processKvIterator<Recipe>(iterator);
    }, "Failed to list recipes (paginated)");
  },

  /**
   * Search for recipes using simple in-memory name filtering
   *
   * Simplified implementation that loads all recipes and filters by name only.
   * This replaces the complex database-based search with indexes.
   *
   * @param params Search parameters (only query supported for now)
   * @returns Array of matching recipes
   * @throws {DatabaseError} If the database operation fails
   */
  async search(params: SearchRecipeParams): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const {
        query,
        limit = 20,
        offset = 0,
      } = params;

      // Load all recipes using efficient kv.list() operation
      const allRecipes: Recipe[] = [];
      for await (const entry of kv.list<Recipe>({ prefix: ["recipe"] })) {
        if (entry.value) {
          allRecipes.push(entry.value);
        }
      }

      // Filter by name, description, and tags if query is provided
      let filteredRecipes = allRecipes;
      if (query && query.trim()) {
        const queryLower = query.toLowerCase().trim();
        filteredRecipes = allRecipes.filter((recipe) =>
          recipe.name.toLowerCase().includes(queryLower) ||
          recipe.description.toLowerCase().includes(queryLower) ||
          recipe.tags.some((tag) => tag.toLowerCase().includes(queryLower))
        );
      }

      // Apply pagination
      const startIndex = offset;
      const endIndex = startIndex + limit;
      return filteredRecipes.slice(startIndex, endIndex);
    }, "Failed to search recipes");
  },

  /**
   * Get recipes by tag using in-memory filtering
   *
   * @param tag Tag to filter by
   * @param limit Maximum number of recipes to return
   * @param offset Number of recipes to skip
   * @returns Array of matching recipes
   * @throws {DatabaseError} If the database operation fails
   */
  async getByTag(tag: string, limit = 20, offset = 0): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      // Load all recipes and filter by tag in memory
      const allRecipes: Recipe[] = [];
      for await (const entry of kv.list<Recipe>({ prefix: ["recipe"] })) {
        if (entry.value) {
          allRecipes.push(entry.value);
        }
      }

      // Filter by tag
      const filteredRecipes = allRecipes.filter((recipe) =>
        recipe.tags.includes(tag)
      );

      // Apply pagination
      const startIndex = offset;
      const endIndex = startIndex + limit;
      return filteredRecipes.slice(startIndex, endIndex);
    }, `Failed to get recipes by tag ${tag}`);
  },

  /**
   * Get recipes by ingredient using in-memory filtering
   *
   * @param ingredientId Ingredient ID to filter by
   * @param limit Maximum number of recipes to return
   * @param offset Number of recipes to skip
   * @returns Array of matching recipes
   * @throws {DatabaseError} If the database operation fails
   */
  async getByIngredient(
    ingredientId: string,
    limit = 20,
    offset = 0,
  ): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      // Load all recipes and filter by ingredient in memory
      const allRecipes: Recipe[] = [];
      for await (const entry of kv.list<Recipe>({ prefix: ["recipe"] })) {
        if (entry.value) {
          allRecipes.push(entry.value);
        }
      }

      // Filter by ingredient
      const filteredRecipes = allRecipes.filter((recipe) =>
        recipe.ingredients.some((ingredient) =>
          ingredient.ingredientId === ingredientId
        )
      );

      // Apply pagination
      const startIndex = offset;
      const endIndex = startIndex + limit;
      return filteredRecipes.slice(startIndex, endIndex);
    }, `Failed to get recipes by ingredient ${ingredientId}`);
  },

  /**
   * Get recipes created by a specific user
   *
   * @param userId User ID to filter by
   * @param limit Maximum number of recipes to return
   * @param offset Number of recipes to skip
   * @returns Array of recipes created by the user
   * @throws {DatabaseError} If the database operation fails
   */
  async getByUser(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const recipes: Recipe[] = [];
      let count = 0;

      for await (
        const entry of kv.list<boolean>({
          prefix: ["user_recipes", userId],
        })
      ) {
        if (count >= offset && recipes.length < limit) {
          const recipeId = entry.key[2] as string;
          const recipe = await this.getById(recipeId);

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
    }, `Failed to get recipes by user ${userId}`);
  },

  /**
   * Get all public recipes (legacy - use getPublicRecipesBatch for better performance)
   *
   * @param limit Maximum number of recipes to return
   * @param offset Number of recipes to skip
   * @returns Array of public recipes
   * @throws {DatabaseError} If the database operation fails
   */
  async getPublicRecipes(
    limit = 20,
    offset = 0,
  ): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const recipes: Recipe[] = [];
      let count = 0;

      for await (
        const entry of kv.list<boolean>({
          prefix: ["public_recipes"],
        })
      ) {
        if (count >= offset && recipes.length < limit) {
          const recipeId = entry.key[1] as string;
          const recipe = await this.getById(recipeId);

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
    }, "Failed to get public recipes");
  },

  /**
   * Get all public recipes using batch fetching for optimal performance
   *
   * This method reduces KV operations from N+1 to 2 calls total:
   * 1. List public recipe IDs (1 KV call)
   * 2. Batch fetch all recipes (1 KV call)
   *
   * @param limit Maximum number of recipes to return
   * @param offset Number of recipes to skip
   * @returns Array of public recipes
   * @throws {DatabaseError} If the database operation fails
   */
  async getPublicRecipesBatch(
    limit = 20,
    offset = 0,
  ): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      // Step 1: Get public recipe IDs efficiently
      const recipeIds: string[] = [];
      let count = 0;

      for await (
        const entry of kv.list<boolean>({
          prefix: ["public_recipes"],
        })
      ) {
        if (count >= offset && recipeIds.length < limit) {
          const recipeId = entry.key[1] as string;
          recipeIds.push(recipeId);
        }
        count++;

        if (recipeIds.length >= limit) {
          break;
        }
      }

      // Early return if no recipes found
      if (recipeIds.length === 0) {
        return [];
      }

      // Step 2: Batch fetch all recipes
      // Deno KV has a limit of 10 keys per getMany operation
      // See: https://docs.deno.com/deploy/kv/manual/transactions/
      const recipes: Recipe[] = [];
      const BATCH_SIZE = 10;

      for (let i = 0; i < recipeIds.length; i += BATCH_SIZE) {
        const batchIds = recipeIds.slice(i, i + BATCH_SIZE);
        const recipeKeys = batchIds.map((id) => ["recipe", id] as const);
        const results = await kv.getMany<Recipe[]>(recipeKeys);

        for (const result of results) {
          if (result.value) {
            recipes.push(result.value);
          }
        }
      }

      return recipes;
    }, "Failed to get public recipes batch");
  },

  /**
   * Check if a recipe is accessible to a user
   * (public recipes or recipes owned by the user)
   *
   * @param recipeId Recipe ID to check
   * @param userId User ID (null for unauthenticated users)
   * @returns True if user can access the recipe
   * @throws {DatabaseError} If the database operation fails
   */
  async canUserAccessRecipe(
    recipeId: string,
    userId: string | null,
  ): Promise<boolean> {
    return await executeDbOperation(async () => {
      const recipe = await this.getById(recipeId);
      if (!recipe) {
        return false;
      }

      // Public recipes are accessible to everyone
      if (recipe.visibility === "public") {
        return true;
      }

      // Private recipes (or undefined visibility - default private) are only accessible to their owners
      if (
        (recipe.visibility === "private" || !recipe.visibility) && userId &&
        recipe.createdBy === userId
      ) {
        return true;
      }

      return false;
    }, `Failed to check recipe access for recipe ${recipeId}`);
  },
};
