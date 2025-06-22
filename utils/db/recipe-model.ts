/// <reference lib="deno.unstable" />

/**
 * Recipe model implementation for the Barsistant application
 *
 * This module provides CRUD operations for recipes, managing both
 * primary records and related indexes.
 */

import { ulid } from "@std/ulid";
import type { IngredientRecipeLink } from "../../types/ingredient.ts";
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
 * Recipe search parameters
 */
export interface SearchRecipeParams {
  query?: string;
  tags?: string[];
  ingredients?: string[]; // Array of ingredient IDs to filter by
  ingredientMode?: "any" | "all"; // Whether to match any or all ingredients (default: 'any')
  strengthMin?: number;
  strengthMax?: number;
  sweetnessMin?: number;
  sweetnessMax?: number;
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
        strength: params.strength || 0,
        sweetness: params.sweetness || 0,
        ingredients: params.ingredients,
        garnish: params.garnish || [],
        glassware: params.glassware || "",
        preparation: params.preparation || [],
        source: params.source,
        tags: params.tags || [],
        createdAt: now,
        updatedAt: now,
      };

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Add the main recipe entry
      transaction.set(["recipe", id], recipe);

      // Create ingredient relationships and indexes
      for (const ingredient of params.ingredients) {
        // Create the recipe-ingredient relationship
        const relationKey = ["recipe_ingredient", id, ingredient.ingredientId];
        const relation: IngredientRecipeLink = {
          recipeId: id,
          ingredientId: ingredient.ingredientId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          optional: ingredient.optional,
          notes: ingredient.notes,
        };
        transaction.set(relationKey, relation);

        // Create the ingredient-recipe index for reverse lookups
        const indexKey = ["ingredient_recipes", ingredient.ingredientId, id];
        transaction.set(indexKey, true);
      }

      // Create secondary indexes

      // Add strength index
      transaction.set(["strength_recipes", recipe.strength, id], true);

      // Add sweetness index
      transaction.set(["sweetness_recipes", recipe.sweetness, id], true);

      // Add tag indexes
      for (const tag of recipe.tags) {
        transaction.set(["tag_recipes", tag, id], true);
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
      };

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Add the main recipe entry
      transaction.set(["recipe", id], updatedRecipe);

      // If tags changed, update tag indexes
      if (params.tags) {
        // Remove old tag indexes
        for (const tag of existingRecipe.tags) {
          transaction.delete(["tag_recipes", tag, id]);
        }

        // Add new tag indexes
        for (const tag of updatedRecipe.tags) {
          transaction.set(["tag_recipes", tag, id], true);
        }
      }

      // If ingredients changed, update ingredient relationships
      if (params.ingredients) {
        // Remove old ingredient relationships and indexes
        for (const ingredient of existingRecipe.ingredients) {
          transaction.delete([
            "recipe_ingredient",
            id,
            ingredient.ingredientId,
          ]);
          transaction.delete([
            "ingredient_recipes",
            ingredient.ingredientId,
            id,
          ]);
        }

        // Add new ingredient relationships and indexes
        for (const ingredient of params.ingredients) {
          // Create the recipe-ingredient relationship
          const relationKey = [
            "recipe_ingredient",
            id,
            ingredient.ingredientId,
          ];
          const relation: IngredientRecipeLink = {
            recipeId: id,
            ingredientId: ingredient.ingredientId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            optional: ingredient.optional,
            notes: ingredient.notes,
          };
          transaction.set(relationKey, relation);

          // Create the ingredient-recipe index for reverse lookups
          const indexKey = ["ingredient_recipes", ingredient.ingredientId, id];
          transaction.set(indexKey, true);
        }
      }

      // If strength changed, update strength index
      if (
        params.strength !== undefined &&
        params.strength !== existingRecipe.strength
      ) {
        transaction.delete(["strength_recipes", existingRecipe.strength, id]);
        transaction.set(["strength_recipes", updatedRecipe.strength, id], true);
      }

      // If sweetness changed, update sweetness index
      if (
        params.sweetness !== undefined &&
        params.sweetness !== existingRecipe.sweetness
      ) {
        transaction.delete(["sweetness_recipes", existingRecipe.sweetness, id]);
        transaction.set(
          ["sweetness_recipes", updatedRecipe.sweetness, id],
          true,
        );
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
   * Delete a recipe by ID
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

      // Delete tag indexes
      for (const tag of existingRecipe.tags) {
        transaction.delete(["tag_recipes", tag, id]);
      }

      // Delete ingredient relationships and indexes
      for (const ingredient of existingRecipe.ingredients) {
        transaction.delete(["recipe_ingredient", id, ingredient.ingredientId]);
        transaction.delete(["ingredient_recipes", ingredient.ingredientId, id]);
      }

      // Delete strength index
      transaction.delete(["strength_recipes", existingRecipe.strength, id]);

      // Delete sweetness index
      transaction.delete(["sweetness_recipes", existingRecipe.sweetness, id]);

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
   * Search for recipes using various filters
   *
   * @param params Search parameters
   * @returns Array of matching recipes
   * @throws {DatabaseError} If the database operation fails
   */
  async search(params: SearchRecipeParams): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const {
        query,
        tags,
        ingredients,
        ingredientMode = "any", // Default to 'any' if not specified
        strengthMin,
        strengthMax,
        sweetnessMin,
        sweetnessMax,
        limit = 20,
        offset = 0,
      } = params;

      let matchingRecipeIds = new Set<string>();
      let isFirstFilter = true;

      // Filter by tags if provided
      if (tags && tags.length > 0) {
        const tagMatches = new Set<string>();

        for (const tag of tags) {
          for await (
            const entry of kv.list<boolean>({ prefix: ["tag_recipes", tag] })
          ) {
            const recipeId = entry.key[2] as string;
            tagMatches.add(recipeId);
          }
        }

        if (isFirstFilter) {
          matchingRecipeIds = tagMatches;
          isFirstFilter = false;
        } else {
          // Intersection with existing matches
          matchingRecipeIds = new Set(
            [...matchingRecipeIds].filter((id) => tagMatches.has(id)),
          );
        }

        // Early return if no matches after filtering
        if (matchingRecipeIds.size === 0) {
          return [];
        }
      }

      // Filter by ingredients if provided
      if (ingredients && ingredients.length > 0) {
        // For 'all' mode, we need to track matches per ingredient
        if (ingredientMode === "all") {
          // Create a map to track which recipes contain which ingredients
          const recipeIngredientMap = new Map<string, Set<string>>();

          // Collect all recipes that contain any of the specified ingredients
          for (const ingredientId of ingredients) {
            for await (
              const entry of kv.list<boolean>({
                prefix: ["ingredient_recipes", ingredientId],
              })
            ) {
              const recipeId = entry.key[2] as string;

              // Initialize the set if this is the first ingredient for this recipe
              if (!recipeIngredientMap.has(recipeId)) {
                recipeIngredientMap.set(recipeId, new Set());
              }

              // Add this ingredient to the recipe's ingredient set
              recipeIngredientMap.get(recipeId)?.add(ingredientId);
            }
          }

          // Filter to recipes that contain all specified ingredients
          const allIngredientMatches = new Set<string>();
          for (
            const [recipeId, ingredientsInRecipe] of recipeIngredientMap
              .entries()
          ) {
            if (ingredientsInRecipe.size === ingredients.length) {
              allIngredientMatches.add(recipeId);
            }
          }

          if (isFirstFilter) {
            matchingRecipeIds = allIngredientMatches;
            isFirstFilter = false;
          } else {
            // Intersection with existing matches
            matchingRecipeIds = new Set(
              [...matchingRecipeIds].filter((id) =>
                allIngredientMatches.has(id)
              ),
            );
          }
        } else {
          // 'any' mode (default) - match recipes with any of the specified ingredients
          const anyIngredientMatches = new Set<string>();

          for (const ingredientId of ingredients) {
            for await (
              const entry of kv.list<boolean>({
                prefix: ["ingredient_recipes", ingredientId],
              })
            ) {
              const recipeId = entry.key[2] as string;
              anyIngredientMatches.add(recipeId);
            }
          }

          if (isFirstFilter) {
            matchingRecipeIds = anyIngredientMatches;
            isFirstFilter = false;
          } else {
            // Intersection with existing matches
            matchingRecipeIds = new Set(
              [...matchingRecipeIds].filter((id) =>
                anyIngredientMatches.has(id)
              ),
            );
          }
        }

        // Early return if no matches after filtering
        if (matchingRecipeIds.size === 0) {
          return [];
        }
      }

      // If we have no filters yet, get all recipes
      if (isFirstFilter) {
        for await (const entry of kv.list<Recipe>({ prefix: ["recipe"] })) {
          const recipeId = entry.key[1] as string;
          matchingRecipeIds.add(recipeId);
        }
      }

      // Fetch full recipe data and apply remaining filters
      const results: Recipe[] = [];
      let count = 0;

      for (const recipeId of matchingRecipeIds) {
        const recipe = (await kv.get<Recipe>(["recipe", recipeId])).value;

        if (!recipe) continue;

        // Apply strength filter if provided
        if (
          (strengthMin !== undefined && recipe.strength < strengthMin) ||
          (strengthMax !== undefined && recipe.strength > strengthMax)
        ) {
          continue;
        }

        // Apply sweetness filter if provided
        if (
          (sweetnessMin !== undefined && recipe.sweetness < sweetnessMin) ||
          (sweetnessMax !== undefined && recipe.sweetness > sweetnessMax)
        ) {
          continue;
        }

        // Apply text search if provided
        if (query) {
          const queryLower = query.toLowerCase();
          const matchesQuery = recipe.name.toLowerCase().includes(queryLower) ||
            recipe.description.toLowerCase().includes(queryLower) ||
            recipe.tags.some((tag) => tag.toLowerCase().includes(queryLower));

          if (!matchesQuery) {
            continue;
          }
        }

        // Apply pagination
        if (count >= offset && results.length < limit) {
          results.push(recipe);
        }
        count++;

        if (results.length >= limit) {
          break;
        }
      }

      return results;
    }, "Failed to search recipes");
  },

  /**
   * Get recipes by tag
   *
   * @param tag Tag to filter by
   * @param limit Maximum number of recipes to return
   * @param offset Number of recipes to skip
   * @returns Array of matching recipes
   * @throws {DatabaseError} If the database operation fails
   */
  async getByTag(tag: string, limit = 20, offset = 0): Promise<Recipe[]> {
    return await executeDbOperation(async () => {
      const recipes: Recipe[] = [];
      let count = 0;

      for await (
        const entry of kv.list<boolean>({ prefix: ["tag_recipes", tag] })
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
    }, `Failed to get recipes by tag ${tag}`);
  },

  /**
   * Get recipes by ingredient
   *
   * @param ingredientId Ingredient name to filter by
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
      const recipes: Recipe[] = [];
      let count = 0;

      for await (
        const entry of kv.list<boolean>({
          prefix: ["ingredient_recipes", ingredientId],
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
    }, `Failed to get recipes by ingredient ${ingredientId}`);
  },
};
