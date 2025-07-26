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
  kv,
  type PublicRecipeKey,
  type UserRecipeKey,
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
        visibility: params.visibility,
        originalRecipeId: params.originalRecipeId,
        createdAt: now,
        updatedAt: now,
      };

      // Store recipe using ULID-based key patterns
      const transaction = kv.atomic();

      // Store in user's recipe namespace: ["user_recipe", userId, ulid] → Recipe
      const userRecipeKey: UserRecipeKey = [
        "user_recipe",
        recipe.createdBy,
        id,
      ];
      transaction.set(userRecipeKey, recipe);

      // If recipe is public, also store in public namespace with same ULID
      if (recipe.visibility === "public") {
        const publicRecipe: Recipe = {
          ...recipe,
          // Keep same ID as user recipe
          originalRecipeId: id, // Track source recipe
        };

        // Store in public namespace: ["public_recipe", ulid] → Recipe
        const publicRecipeKey: PublicRecipeKey = ["public_recipe", id];
        transaction.set(publicRecipeKey, publicRecipe);

        // No need to update user recipe since we're using the same ID
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
   * @param userId Optional user ID for efficient lookup in user namespace
   * @returns The recipe or null if not found
   * @throws {DatabaseError} If the database operation fails
   */
  async getById(id: string, userId?: string): Promise<Recipe | null> {
    return await executeDbOperation(async () => {
      if (userId) {
        // Efficient lookup in user's namespace if userId is provided
        const userRecipe = await this.getUserRecipeById(userId, id);
        if (userRecipe) {
          return userRecipe;
        }
        // If not found in user namespace, fallback to public namespace
        return await this.getPublicRecipeById(id);
      } else {
        // When no userId provided, only check public namespace
        return await this.getPublicRecipeById(id);
      }
    }, "Failed to get recipe");
  },

  /**
   * Get any recipe by ID across all namespaces (admin use case)
   *
   * This method searches both user and public namespaces comprehensively.
   * Intended for admin interfaces where full access is needed.
   *
   * @param id Recipe ID
   * @returns The recipe or null if not found
   * @throws {DatabaseError} If the database operation fails
   */
  async getByIdForAdmin(id: string): Promise<Recipe | null> {
    return await executeDbOperation(async () => {
      // First check public namespace for efficiency (most recipes might be public)
      const publicRecipe = await this.getPublicRecipeById(id);
      if (publicRecipe) {
        return publicRecipe;
      }

      // Search all user namespaces
      for await (
        const entry of kv.list<Recipe>({ prefix: ["user_recipe"] })
      ) {
        if (entry.value && entry.value.id === id) {
          return entry.value;
        }
      }

      return null;
    }, "Failed to get recipe for admin");
  },

  /**
   * Get a user's recipe by ID (more efficient when you know the user)
   *
   * @param userId User ID
   * @param recipeId Recipe ID
   * @returns The recipe or null if not found
   */
  async getUserRecipeById(
    userId: string,
    recipeId: string,
  ): Promise<Recipe | null> {
    return await executeDbOperation(async () => {
      const userRecipeKey: UserRecipeKey = ["user_recipe", userId, recipeId];
      const result = await kv.get<Recipe>(userRecipeKey);
      return result.value;
    }, "Failed to get user recipe");
  },

  /**
   * Get a public recipe by ID (more efficient for public recipes)
   *
   * @param recipeId Recipe ID
   * @returns The recipe or null if not found
   */
  async getPublicRecipeById(recipeId: string): Promise<Recipe | null> {
    return await executeDbOperation(async () => {
      const publicRecipeKey: PublicRecipeKey = ["public_recipe", recipeId];
      const result = await kv.get<Recipe>(publicRecipeKey);
      return result.value;
    }, "Failed to get public recipe");
  },

  /**
   * Update an existing recipe
   *
   * @param userId User ID (owner of the recipe)
   * @param recipeId Recipe ID
   * @param params Update parameters
   * @returns The updated recipe
   * @throws {Error} If the recipe doesn't exist or user doesn't own it
   * @throws {DatabaseError} If the database operation fails
   */
  async updateUserRecipe(
    userId: string,
    recipeId: string,
    params: UpdateRecipeParams,
  ): Promise<Recipe> {
    return await executeDbOperation(async () => {
      // Get existing user recipe
      const existingRecipe = await this.getUserRecipeById(userId, recipeId);

      if (!existingRecipe) {
        throw new Error(
          `Recipe with ID ${recipeId} not found for user ${userId}`,
        );
      }

      const now = new Date().toISOString();

      // Validate ingredients if being updated
      if (params.ingredients) {
        for (const ingredient of params.ingredients) {
          if (!ingredient.name || ingredient.name.trim() === "") {
            throw new Error("Each ingredient must have a name");
          }
        }
      }

      // Create updated recipe
      const updatedRecipe: Recipe = {
        ...existingRecipe,
        ...params,
        id: recipeId, // Preserve original ID
        updatedAt: now,
        createdAt: existingRecipe.createdAt, // Preserve creation date
        createdBy: existingRecipe.createdBy, // Cannot change ownership
      };

      const transaction = kv.atomic();

      // Handle visibility changes
      const oldVisibility = existingRecipe.visibility;
      const newVisibility = updatedRecipe.visibility;

      if (oldVisibility !== newVisibility) {
        if (newVisibility === "public" && oldVisibility === "private") {
          // Making recipe public: use same ULID as user recipe
          const publicRecipe: Recipe = {
            ...updatedRecipe,
            originalRecipeId: recipeId,
          };

          // Store public recipe with same ULID
          const newPublicRecipeKey: PublicRecipeKey = [
            "public_recipe",
            recipeId,
          ];
          transaction.set(newPublicRecipeKey, publicRecipe);

          // Public version uses same ID as user recipe
        } else if (newVisibility === "private" && oldVisibility === "public") {
          // Making recipe private: remove from public namespace
          const existingPublicRecipeKey: PublicRecipeKey = [
            "public_recipe",
            recipeId,
          ];
          transaction.delete(existingPublicRecipeKey);

          // Public recipe uses same ID, so no reference to clear
        }
      } else if (newVisibility === "public") {
        // Recipe is staying public, update the public version too
        const publicRecipe: Recipe = {
          ...updatedRecipe,
          originalRecipeId: recipeId,
        };
        const updatePublicRecipeKey: PublicRecipeKey = [
          "public_recipe",
          recipeId,
        ];
        transaction.set(updatePublicRecipeKey, publicRecipe);
      }

      // Always update user recipe
      const updateUserRecipeKey: UserRecipeKey = [
        "user_recipe",
        userId,
        recipeId,
      ];
      transaction.set(updateUserRecipeKey, updatedRecipe);

      // Commit transaction
      const result = await transaction.commit();
      if (!result.ok) {
        throw new Error(`Failed to update recipe: ${result.toString()}`);
      }

      return updatedRecipe;
    }, `Failed to update recipe ${recipeId}`);
  },

  /**
   * Delete a user's recipe and all related data
   *
   * @param userId User ID (owner of the recipe)
   * @param recipeId Recipe ID
   * @returns True if successfully deleted, false if recipe not found
   * @throws {DatabaseError} If the database operation fails
   */
  async deleteUserRecipe(userId: string, recipeId: string): Promise<boolean> {
    return await executeDbOperation(async () => {
      // Get existing recipe
      const existingRecipe = await this.getUserRecipeById(userId, recipeId);

      if (!existingRecipe) {
        return false;
      }

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Delete the user recipe
      const deleteUserRecipeKey: UserRecipeKey = [
        "user_recipe",
        userId,
        recipeId,
      ];
      transaction.delete(deleteUserRecipeKey);

      // If recipe is public, also delete from public namespace
      if (existingRecipe.visibility === "public") {
        const deletePublicRecipeKey: PublicRecipeKey = [
          "public_recipe",
          recipeId,
        ];
        transaction.delete(deletePublicRecipeKey);
      }

      // Delete all user favorites for this recipe
      const recipeIdsToClean = [recipeId];

      for (const idToClean of recipeIdsToClean) {
        for await (const entry of kv.list({ prefix: ["user_favorites"] })) {
          const key = entry.key as [string, string, string];
          if (key.length === 3 && key[2] === idToClean) {
            transaction.delete(key);
          }
        }

        // Delete all user notes for this recipe
        for await (const entry of kv.list({ prefix: ["user_notes"] })) {
          const key = entry.key as [string, string, string];
          if (key.length === 3 && key[2] === idToClean) {
            transaction.delete(key);
          }
        }

        // Delete from user collections
        for await (const entry of kv.list({ prefix: ["user_collections"] })) {
          const key = entry.key as [string, string, string];
          if (key.length === 3 && key[2] === idToClean) {
            transaction.delete(key);
          }
        }
      }

      // Commit transaction
      const result = await transaction.commit();
      if (!result.ok) {
        throw new Error(`Failed to delete recipe: ${result.toString()}`);
      }

      return true;
    }, `Failed to delete recipe ${recipeId}`);
  },

  /**
   * List all recipes from both user and public namespaces
   * Note: This combines all recipes across all users - use carefully
   *
   * @param limit Maximum number of recipes to return (optional)
   * @returns Array of recipes sorted by creation time (newest first)
   * @throws {DatabaseError} If the database operation fails
   */
  async listAll(limit?: number): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const recipes: Recipe[] = [];

      // Collect all user recipes
      for await (const entry of kv.list<Recipe>({ prefix: ["user_recipe"] })) {
        if (entry.value && (!limit || recipes.length < limit)) {
          recipes.push(entry.value);
        }
      }

      // Collect all public recipes (avoid duplicates)
      const existingIds = new Set(recipes.map((r) => r.id));
      for await (
        const entry of kv.list<Recipe>({ prefix: ["public_recipe"] })
      ) {
        if (
          entry.value && !existingIds.has(entry.value.id) &&
          (!limit || recipes.length < limit)
        ) {
          recipes.push(entry.value);
        }
      }

      // Sort by creation time (newest first) - ULID contains timestamp
      recipes.sort((a, b) => b.id.localeCompare(a.id));

      return limit ? recipes.slice(0, limit) : recipes;
    }, "Failed to list recipes");
  },

  /**
   * List recipes for a specific user (chronologically sorted by ULID)
   *
   * @param userId User ID
   * @param limit Maximum number of recipes to return
   * @returns Array of user's recipes (newest first)
   */
  async listUserRecipes(userId: string, limit?: number): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const recipes: Recipe[] = [];

      // Get user's recipes with reverse ordering (newest first)
      for await (
        const entry of kv.list<Recipe>(
          { prefix: ["user_recipe", userId] },
          { reverse: true, limit },
        )
      ) {
        if (entry.value) {
          recipes.push(entry.value);
        }
      }

      return recipes;
    }, `Failed to list user recipes for ${userId}`);
  },

  /**
   * List public recipes (chronologically sorted by ULID)
   *
   * @param limit Maximum number of recipes to return
   * @returns Array of public recipes (newest first)
   */
  async listPublicRecipes(limit?: number): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const recipes: Recipe[] = [];

      // Use prefix to get public recipes with reverse ordering (newest first)
      for await (
        const entry of kv.list<Recipe>(
          { prefix: ["public_recipe"] },
          { reverse: true, limit },
        )
      ) {
        if (entry.value) {
          recipes.push(entry.value);
        }
      }

      return recipes;
    }, "Failed to list public recipes");
  },

  /**
   * Copy a recipe to a user's collection with provenance tracking
   *
   * @param sourceRecipeId ID of the recipe to copy (can be user or public recipe)
   * @param targetUserId User ID who is copying the recipe
   * @param visibility Visibility of the copied recipe (default: "private")
   * @returns The copied recipe
   * @throws {Error} If source recipe not found or copy fails
   */
  async copyRecipe(
    sourceRecipeId: string,
    targetUserId: string,
    visibility: "private" | "public" = "private",
  ): Promise<Recipe> {
    return await executeDbOperation(async () => {
      // Find the source recipe (use targetUserId to check if they own it, fallback to admin)
      let sourceRecipe = await this.getById(sourceRecipeId, targetUserId);
      if (!sourceRecipe) {
        // If not found in user's namespace, try admin access for public recipes
        sourceRecipe = await this.getByIdForAdmin(sourceRecipeId);
      }
      if (!sourceRecipe) {
        throw new Error(`Source recipe ${sourceRecipeId} not found`);
      }

      // Generate ULID for the copied recipe
      const newRecipeId = ulid();
      const now = new Date().toISOString();

      // Create copied recipe with provenance tracking
      const copiedRecipe: Recipe = {
        ...sourceRecipe,
        id: newRecipeId,
        createdBy: targetUserId,
        visibility,
        originalRecipeId: sourceRecipeId, // Track the source
        createdAt: now,
        updatedAt: now,
      };

      const transaction = kv.atomic();

      // Store in user's namespace
      const copyUserRecipeKey: UserRecipeKey = [
        "user_recipe",
        targetUserId,
        newRecipeId,
      ];
      transaction.set(copyUserRecipeKey, copiedRecipe);

      // If copying as public, also store in public namespace with same ID
      if (visibility === "public") {
        const publicRecipe: Recipe = {
          ...copiedRecipe,
          // Keep same ID as copied recipe
          originalRecipeId: sourceRecipeId, // Still track original source
        };

        const copyPublicRecipeKey: PublicRecipeKey = [
          "public_recipe",
          newRecipeId,
        ];
        transaction.set(copyPublicRecipeKey, publicRecipe);

        // No need to update user recipe since we're using the same ID
      }

      // Commit transaction
      const result = await transaction.commit();
      if (!result.ok) {
        throw new Error(`Failed to copy recipe: ${result.toString()}`);
      }

      return copiedRecipe;
    }, `Failed to copy recipe ${sourceRecipeId}`);
  },

  /**
   * List all user recipes across all users for admin interface.
   * Uses offset-based pagination since we need to list across multiple user namespaces.
   *
   * @param limit Number of recipes per page (default: 30)
   * @param cursor Offset cursor from previous page for pagination
   * @returns { items: Recipe[], cursor: string, total: number }
   */
  async listUserRecipesForAdmin({
    limit = 30,
    cursor = "",
  }: {
    limit?: number;
    cursor?: string;
  }) {
    return await executeDbOperation(async () => {
      const allRecipes: Recipe[] = [];

      // Collect all user recipes (sorted by ULID which gives us chronological order)
      for await (const entry of kv.list<Recipe>({ prefix: ["user_recipe"] })) {
        if (entry.value) {
          allRecipes.push(entry.value);
        }
      }

      // Sort by ID (ULID) in descending order (newest first)
      allRecipes.sort((a, b) => b.id.localeCompare(a.id));

      // Apply offset-based pagination
      const offset = cursor ? parseInt(cursor) || 0 : 0;
      const paginatedRecipes = allRecipes.slice(offset, offset + limit);

      // Calculate next cursor
      const hasMore = offset + limit < allRecipes.length;
      const nextCursor = hasMore ? String(offset + limit) : "";

      return {
        items: paginatedRecipes,
        cursor: nextCursor,
        total: allRecipes.length,
      };
    }, "Failed to list user recipes for admin");
  },

  /**
   * Search user recipes for admin interface.
   * Only searches within user recipe namespace.
   *
   * @param query Search query for name, description, or tags
   * @param limit Maximum number of results (default: 50)
   * @returns Array of matching recipes
   */
  async searchUserRecipesForAdmin({
    query,
    limit = 50,
  }: {
    query: string;
    limit?: number;
  }): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const allRecipes: Recipe[] = [];

      // Collect all user recipes
      for await (const entry of kv.list<Recipe>({ prefix: ["user_recipe"] })) {
        if (entry.value) {
          allRecipes.push(entry.value);
        }
      }

      // Filter by search query
      const queryLower = query.toLowerCase().trim();
      const filteredRecipes = allRecipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(queryLower) ||
        recipe.description.toLowerCase().includes(queryLower) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(queryLower))
      );

      // Sort by ID (ULID) in descending order (newest first)
      filteredRecipes.sort((a, b) => b.id.localeCompare(a.id));

      // Apply limit
      return filteredRecipes.slice(0, limit);
    }, "Failed to search user recipes for admin");
  },

  /**
   * @deprecated Use listUserRecipesForAdmin() instead
   * List recipes with pagination support for admin interface.
   * This method combines recipes from both user and public namespaces.
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
      // Get all recipes for admin pagination
      const allRecipes = await this.listAll();

      // Simple offset-based pagination
      const offset = cursor ? parseInt(cursor) || 0 : 0;
      const items = allRecipes.slice(offset, offset + limit);
      const nextCursor = (offset + limit < allRecipes.length)
        ? String(offset + limit)
        : "";

      return { items, cursor: nextCursor };
    }, "Failed to list recipes (paginated)");
  },

  /**
   * Search public recipes only (safe for unauthenticated users)
   *
   * @param params Search parameters
   * @returns Array of matching public recipes
   * @throws {DatabaseError} If the database operation fails
   */
  async searchPublicRecipes(params: SearchRecipeParams): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const {
        query,
        limit = 20,
        offset = 0,
      } = params;

      const publicRecipes: Recipe[] = [];

      // Load only public recipes
      for await (
        const entry of kv.list<Recipe>({ prefix: ["public_recipe"] })
      ) {
        if (entry.value) {
          publicRecipes.push(entry.value);
        }
      }

      // Filter by name, description, and tags if query is provided
      let filteredRecipes = publicRecipes;
      if (query && query.trim()) {
        const queryLower = query.toLowerCase().trim();
        filteredRecipes = publicRecipes.filter((recipe) =>
          recipe.name.toLowerCase().includes(queryLower) ||
          recipe.description.toLowerCase().includes(queryLower) ||
          recipe.tags.some((tag) => tag.toLowerCase().includes(queryLower))
        );
      }

      // Apply pagination
      const startIndex = offset;
      const endIndex = startIndex + limit;
      return filteredRecipes.slice(startIndex, endIndex);
    }, "Failed to search public recipes");
  },

  /**
   * Search recipes accessible to a specific user (public + their own private)
   *
   * @param userId User ID (must be provided)
   * @param params Search parameters
   * @returns Array of matching accessible recipes
   * @throws {DatabaseError} If the database operation fails
   */
  async searchUserAccessibleRecipes(
    userId: string,
    params: SearchRecipeParams,
  ): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const {
        query,
        limit = 20,
        offset = 0,
      } = params;

      const accessibleRecipes: Recipe[] = [];

      // Load user's own recipes (both public and private)
      for await (
        const entry of kv.list<Recipe>({ prefix: ["user_recipe", userId] })
      ) {
        if (entry.value) {
          accessibleRecipes.push(entry.value);
        }
      }

      // Load public recipes from other users (avoid duplicates)
      const existingIds = new Set(accessibleRecipes.map((r) => r.id));
      for await (
        const entry of kv.list<Recipe>({ prefix: ["public_recipe"] })
      ) {
        if (entry.value && !existingIds.has(entry.value.id)) {
          // Only include if it's not the user's own recipe (already included above)
          if (entry.value.createdBy !== userId) {
            accessibleRecipes.push(entry.value);
          }
        }
      }

      // Filter by name, description, and tags if query is provided
      let filteredRecipes = accessibleRecipes;
      if (query && query.trim()) {
        const queryLower = query.toLowerCase().trim();
        filteredRecipes = accessibleRecipes.filter((recipe) =>
          recipe.name.toLowerCase().includes(queryLower) ||
          recipe.description.toLowerCase().includes(queryLower) ||
          recipe.tags.some((tag) => tag.toLowerCase().includes(queryLower))
        );
      }

      // Apply pagination
      const startIndex = offset;
      const endIndex = startIndex + limit;
      return filteredRecipes.slice(startIndex, endIndex);
    }, `Failed to search accessible recipes for user ${userId}`);
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
      // Load all recipes from both namespaces and filter by tag in memory
      const allRecipes: Recipe[] = [];

      // Load user recipes
      for await (const entry of kv.list<Recipe>({ prefix: ["user_recipe"] })) {
        if (entry.value) {
          allRecipes.push(entry.value);
        }
      }

      // Load public recipes (avoid duplicates)
      const existingIds = new Set(allRecipes.map((r) => r.id));
      for await (
        const entry of kv.list<Recipe>({ prefix: ["public_recipe"] })
      ) {
        if (entry.value && !existingIds.has(entry.value.id)) {
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
      // Load all recipes from both namespaces and filter by ingredient in memory
      const allRecipes: Recipe[] = [];

      // Load user recipes
      for await (const entry of kv.list<Recipe>({ prefix: ["user_recipe"] })) {
        if (entry.value) {
          allRecipes.push(entry.value);
        }
      }

      // Load public recipes (avoid duplicates)
      const existingIds = new Set(allRecipes.map((r) => r.id));
      for await (
        const entry of kv.list<Recipe>({ prefix: ["public_recipe"] })
      ) {
        if (entry.value && !existingIds.has(entry.value.id)) {
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
      // First try to get the recipe from user's namespace if userId is provided
      let recipe: Recipe | null = null;
      if (userId) {
        recipe = await this.getUserRecipeById(userId, recipeId);
        if (recipe) {
          // Found in user's namespace, so they have access
          return true;
        }
      }

      // If not found in user namespace or no userId, check public namespace
      recipe = await this.getPublicRecipeById(recipeId);
      if (recipe && recipe.visibility === "public") {
        return true;
      }

      return false;
    }, `Failed to check recipe access for recipe ${recipeId}`);
  },
};
