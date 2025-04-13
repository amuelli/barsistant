/// <reference lib="deno.unstable" />

/**
 * Ingredient model implementation for the Barsistant application
 *
 * This module provides CRUD operations for ingredients, managing both
 * primary records and related indexes.
 */

import { ulid } from "https://deno.land/x/ulid@v0.3.0/mod.ts";
import type {
  Ingredient,
  IngredientType,
  MeasurementUnit,
} from "../types/index.ts";
import { executeDbOperation, kv } from "./db.ts";

/**
 * Ingredient creation parameters
 */
export interface CreateIngredientParams {
  name: string;
  description: string;
  type: IngredientType;
  abv?: number;
  commonMeasurements: MeasurementUnit[];
  substitutes?: string[];
  image?: string;
  allergens?: string[];
}

/**
 * Ingredient update parameters (same as create but all fields optional)
 */
export type UpdateIngredientParams = Partial<CreateIngredientParams>;

/**
 * Ingredient search parameters
 */
export interface SearchIngredientParams {
  query?: string;
  types?: IngredientType[];
  withSubstitutes?: boolean;
  withAllergens?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Ingredient model with CRUD operations
 */
export const ingredientModel = {
  /**
   * Create a new ingredient
   *
   * @param params Ingredient creation parameters
   * @returns The created ingredient
   * @throws {DatabaseError} If the database operation fails
   */
  async create(params: CreateIngredientParams): Promise<Ingredient> {
    return await executeDbOperation(async () => {
      // Validate inputs
      if (!params.name || params.name.trim() === "") {
        throw new Error("Ingredient name is required");
      }

      if (!params.type) {
        throw new Error("Ingredient type is required");
      }

      if (
        !Array.isArray(params.commonMeasurements) ||
        params.commonMeasurements.length === 0
      ) {
        throw new Error("At least one common measurement unit is required");
      }

      // Generate unique ID
      const id = ulid();
      const now = new Date().toISOString();

      // Create ingredient object
      const ingredient: Ingredient = {
        id,
        name: params.name.trim(),
        description: params.description || "",
        type: params.type,
        commonMeasurements: params.commonMeasurements,
        createdAt: now,
        updatedAt: now,
      };

      // Add optional fields
      if (params.abv !== undefined) ingredient.abv = params.abv;
      if (params.substitutes) ingredient.substitutes = params.substitutes;
      if (params.image) ingredient.image = params.image;
      if (params.allergens) ingredient.allergens = params.allergens;

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Add the main ingredient entry
      transaction.set(["ingredient", id], ingredient);

      // Create secondary indexes

      // Add type index for quick lookups by ingredient type
      transaction.set(["ingredient_type", params.type, id], true);

      // Add search terms for case-insensitive search
      const searchableTerms = params.name.toLowerCase().split(/\s+/);
      for (const term of searchableTerms) {
        transaction.set(["ingredient_search", term, id], true);
      }

      // If there are substitutes, create indexes for them
      if (params.substitutes && params.substitutes.length > 0) {
        // Index for finding ingredients that have substitutes
        transaction.set(["ingredient_with_substitutes", id], true);

        // Create bidirectional substitute relationships
        for (const substituteId of params.substitutes) {
          transaction.set(["ingredient_substitute", id, substituteId], true);
          transaction.set(
            ["ingredient_substitute_for", substituteId, id],
            true,
          );
        }
      }

      // If there are allergens, create indexes for them
      if (params.allergens && params.allergens.length > 0) {
        for (const allergen of params.allergens) {
          transaction.set(["ingredient_allergen", allergen, id], true);
        }
      }

      // Commit transaction
      const result = await transaction.commit();

      if (!result.ok) {
        throw new Error(`Failed to create ingredient: ${result.toString()}`);
      }

      return ingredient;
    }, "Failed to create ingredient");
  },

  /**
   * Get an ingredient by ID
   *
   * @param id Ingredient ID
   * @returns The ingredient or null if not found
   * @throws {DatabaseError} If the database operation fails
   */
  async getById(id: string): Promise<Ingredient | null> {
    return await executeDbOperation(async () => {
      const result = await kv.get<Ingredient>(["ingredient", id]);
      return result.value;
    }, "Failed to get ingredient");
  },

  /**
   * Update an existing ingredient
   *
   * @param id Ingredient ID
   * @param params Update parameters
   * @returns The updated ingredient
   * @throws {Error} If the ingredient doesn't exist
   * @throws {DatabaseError} If the database operation fails
   */
  async update(
    id: string,
    params: UpdateIngredientParams,
  ): Promise<Ingredient> {
    return await executeDbOperation(async () => {
      // Get existing ingredient
      const result = await kv.get<Ingredient>(["ingredient", id]);

      if (!result.value) {
        throw new Error(`Ingredient with ID ${id} not found`);
      }

      const existingIngredient = result.value;
      const now = new Date().toISOString();

      // Update ingredient fields while preserving existing data
      const updatedIngredient: Ingredient = {
        ...existingIngredient,
        ...params,
        id, // Ensure ID doesn't change
        updatedAt: now,
        createdAt: existingIngredient.createdAt, // Preserve creation date
      };

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Update the main ingredient entry
      transaction.set(["ingredient", id], updatedIngredient);

      // If type changed, update type indexes
      if (params.type && params.type !== existingIngredient.type) {
        transaction.delete(["ingredient_type", existingIngredient.type, id]);
        transaction.set(["ingredient_type", updatedIngredient.type, id], true);
      }

      // If name changed, update search terms
      if (params.name) {
        // Get old search terms
        const oldSearchableTerms = existingIngredient.name.toLowerCase().split(
          /\s+/,
        );

        // Delete old search term indexes
        for (const term of oldSearchableTerms) {
          transaction.delete(["ingredient_search", term, id]);
        }

        // Add new search term indexes
        const newSearchableTerms = updatedIngredient.name.toLowerCase().split(
          /\s+/,
        );
        for (const term of newSearchableTerms) {
          transaction.set(["ingredient_search", term, id], true);
        }
      }

      // If substitutes changed, update substitute indexes
      if (params.substitutes !== undefined) {
        // Clean up old substitute relationships
        if (existingIngredient.substitutes) {
          for (const substituteId of existingIngredient.substitutes) {
            transaction.delete(["ingredient_substitute", id, substituteId]);
            transaction.delete(["ingredient_substitute_for", substituteId, id]);
          }
        }

        // Remove the "has substitutes" flag if there are no substitutes now
        if (!params.substitutes || params.substitutes.length === 0) {
          transaction.delete(["ingredient_with_substitutes", id]);
        } else {
          // Add the "has substitutes" flag
          transaction.set(["ingredient_with_substitutes", id], true);

          // Create new substitute relationships
          for (const substituteId of params.substitutes) {
            transaction.set(["ingredient_substitute", id, substituteId], true);
            transaction.set(
              ["ingredient_substitute_for", substituteId, id],
              true,
            );
          }
        }
      }

      // If allergens changed, update allergen indexes
      if (params.allergens !== undefined) {
        // Clean up old allergen relationships
        if (existingIngredient.allergens) {
          for (const allergen of existingIngredient.allergens) {
            transaction.delete(["ingredient_allergen", allergen, id]);
          }
        }

        // Create new allergen relationships
        if (params.allergens && params.allergens.length > 0) {
          for (const allergen of params.allergens) {
            transaction.set(["ingredient_allergen", allergen, id], true);
          }
        }
      }

      // Commit transaction
      const result2 = await transaction.commit();

      if (!result2.ok) {
        throw new Error(`Failed to update ingredient: ${result2.toString()}`);
      }

      return updatedIngredient;
    }, `Failed to update ingredient ${id}`);
  },

  /**
   * Delete an ingredient by ID
   *
   * @param id Ingredient ID
   * @returns True if successfully deleted, false if ingredient not found
   * @throws {DatabaseError} If the database operation fails
   */
  async delete(id: string): Promise<boolean> {
    return await executeDbOperation(async () => {
      // Get existing ingredient to remove all indexes
      const result = await kv.get<Ingredient>(["ingredient", id]);

      if (!result.value) {
        return false;
      }

      const existingIngredient = result.value;

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Delete the main ingredient entry
      transaction.delete(["ingredient", id]);

      // Delete type index
      transaction.delete(["ingredient_type", existingIngredient.type, id]);

      // Delete search term indexes
      const searchableTerms = existingIngredient.name.toLowerCase().split(
        /\s+/,
      );
      for (const term of searchableTerms) {
        transaction.delete(["ingredient_search", term, id]);
      }

      // Delete substitute indexes
      if (
        existingIngredient.substitutes &&
        existingIngredient.substitutes.length > 0
      ) {
        transaction.delete(["ingredient_with_substitutes", id]);

        for (const substituteId of existingIngredient.substitutes) {
          transaction.delete(["ingredient_substitute", id, substituteId]);
          transaction.delete(["ingredient_substitute_for", substituteId, id]);
        }
      }

      // Delete allergen indexes
      if (
        existingIngredient.allergens && existingIngredient.allergens.length > 0
      ) {
        for (const allergen of existingIngredient.allergens) {
          transaction.delete(["ingredient_allergen", allergen, id]);
        }
      }

      // Also need to check and delete any recipe relationships
      // This should be done carefully to avoid orphaned references

      // Get all recipes that use this ingredient
      const recipesWithIngredient = kv.list({
        prefix: ["ingredient_recipes", id],
      });

      // For each recipe, we should remove the ingredient relation
      for await (const entry of recipesWithIngredient) {
        const recipeId = entry.key[2] as string;
        transaction.delete(["recipe_ingredient", recipeId, id]);
        transaction.delete(["ingredient_recipes", id, recipeId]);
      }

      // Commit transaction
      const result2 = await transaction.commit();

      if (!result2.ok) {
        throw new Error(`Failed to delete ingredient: ${result2.toString()}`);
      }

      return true;
    }, `Failed to delete ingredient ${id}`);
  },

  /**
   * List all ingredients
   *
   * @param limit Maximum number of ingredients to return
   * @param offset Number of ingredients to skip
   * @returns Array of ingredients
   * @throws {DatabaseError} If the database operation fails
   */
  async listAll(limit = 20, offset = 0): Promise<Ingredient[]> {
    return await executeDbOperation(async () => {
      const ingredients: Ingredient[] = [];

      let count = 0;
      for await (
        const entry of kv.list<Ingredient>({ prefix: ["ingredient"] })
      ) {
        if (count >= offset && ingredients.length < limit) {
          ingredients.push(entry.value);
        }
        count++;

        if (ingredients.length >= limit) {
          break;
        }
      }

      return ingredients;
    }, "Failed to list ingredients");
  },

  /**
   * Search for ingredients using various filters
   *
   * @param params Search parameters
   * @returns Array of matching ingredients
   * @throws {DatabaseError} If the database operation fails
   */
  async search(params: SearchIngredientParams): Promise<Ingredient[]> {
    return await executeDbOperation(async () => {
      const {
        query,
        types,
        withSubstitutes,
        withAllergens,
        limit = 20,
        offset = 0,
      } = params;

      let matchingIngredientIds = new Set<string>();
      let isFirstFilter = true;

      // Filter by types if provided
      if (types && types.length > 0) {
        const typeMatches = new Set<string>();

        for (const type of types) {
          for await (
            const entry of kv.list<boolean>({
              prefix: ["ingredient_type", type],
            })
          ) {
            const ingredientId = entry.key[2] as string;
            typeMatches.add(ingredientId);
          }
        }

        if (isFirstFilter) {
          matchingIngredientIds = typeMatches;
          isFirstFilter = false;
        } else {
          // Intersection with existing matches
          matchingIngredientIds = new Set(
            [...matchingIngredientIds].filter((id) => typeMatches.has(id)),
          );
        }

        // Early return if no matches after filtering
        if (matchingIngredientIds.size === 0) {
          return [];
        }
      }

      // Filter by ingredients with substitutes if requested
      if (withSubstitutes) {
        const substitutesMatches = new Set<string>();

        for await (
          const entry of kv.list<boolean>({
            prefix: ["ingredient_with_substitutes"],
          })
        ) {
          const ingredientId = entry.key[1] as string;
          substitutesMatches.add(ingredientId);
        }

        if (isFirstFilter) {
          matchingIngredientIds = substitutesMatches;
          isFirstFilter = false;
        } else {
          // Intersection with existing matches
          matchingIngredientIds = new Set(
            [...matchingIngredientIds].filter((id) =>
              substitutesMatches.has(id)
            ),
          );
        }

        // Early return if no matches after filtering
        if (matchingIngredientIds.size === 0) {
          return [];
        }
      }

      // Filter by allergens if provided
      if (withAllergens && withAllergens.length > 0) {
        const allergenMatches = new Set<string>();

        for (const allergen of withAllergens) {
          for await (
            const entry of kv.list<boolean>({
              prefix: ["ingredient_allergen", allergen],
            })
          ) {
            const ingredientId = entry.key[2] as string;
            allergenMatches.add(ingredientId);
          }
        }

        if (isFirstFilter) {
          matchingIngredientIds = allergenMatches;
          isFirstFilter = false;
        } else {
          // Intersection with existing matches
          matchingIngredientIds = new Set(
            [...matchingIngredientIds].filter((id) => allergenMatches.has(id)),
          );
        }

        // Early return if no matches after filtering
        if (matchingIngredientIds.size === 0) {
          return [];
        }
      }

      // Text search if a query is provided
      if (query) {
        const queryTerms = query.toLowerCase().split(/\s+/);
        const queryMatches = new Set<string>();

        for (const term of queryTerms) {
          for await (
            const entry of kv.list<boolean>({
              prefix: ["ingredient_search", term],
            })
          ) {
            const ingredientId = entry.key[2] as string;
            queryMatches.add(ingredientId);
          }
        }

        if (isFirstFilter) {
          matchingIngredientIds = queryMatches;
          isFirstFilter = false;
        } else {
          // Intersection with existing matches
          matchingIngredientIds = new Set(
            [...matchingIngredientIds].filter((id) => queryMatches.has(id)),
          );
        }

        // Early return if no matches after filtering
        if (matchingIngredientIds.size === 0) {
          return [];
        }
      }

      // If we have no filters yet, get all ingredients
      if (isFirstFilter) {
        for await (
          const entry of kv.list<Ingredient>({ prefix: ["ingredient"] })
        ) {
          const ingredientId = entry.key[1] as string;
          matchingIngredientIds.add(ingredientId);
        }
      }

      // Fetch full ingredient data and apply pagination
      const results: Ingredient[] = [];
      let count = 0;

      for (const ingredientId of matchingIngredientIds) {
        if (count >= offset && results.length < limit) {
          const ingredient = await this.getById(ingredientId);
          if (ingredient) {
            results.push(ingredient);
          }
        }
        count++;

        if (results.length >= limit) {
          break;
        }
      }

      return results;
    }, "Failed to search ingredients");
  },

  /**
   * Get ingredients by type
   *
   * @param type Ingredient type to filter by
   * @param limit Maximum number of ingredients to return
   * @param offset Number of ingredients to skip
   * @returns Array of matching ingredients
   * @throws {DatabaseError} If the database operation fails
   */
  async getByType(
    type: IngredientType,
    limit = 20,
    offset = 0,
  ): Promise<Ingredient[]> {
    return await executeDbOperation(async () => {
      const ingredients: Ingredient[] = [];
      let count = 0;

      for await (
        const entry of kv.list<boolean>({ prefix: ["ingredient_type", type] })
      ) {
        if (count >= offset && ingredients.length < limit) {
          const ingredientId = entry.key[2] as string;
          const ingredient = await this.getById(ingredientId);

          if (ingredient) {
            ingredients.push(ingredient);
          }
        }
        count++;

        if (ingredients.length >= limit) {
          break;
        }
      }

      return ingredients;
    }, `Failed to get ingredients by type ${type}`);
  },

  /**
   * Get substitutes for an ingredient
   *
   * @param id Ingredient ID
   * @returns Array of substitute ingredients
   * @throws {DatabaseError} If the database operation fails
   */
  async getSubstitutes(id: string): Promise<Ingredient[]> {
    return await executeDbOperation(async () => {
      const substitutes: Ingredient[] = [];

      const ingredient = await this.getById(id);
      if (
        !ingredient || !ingredient.substitutes ||
        ingredient.substitutes.length === 0
      ) {
        return [];
      }

      for (const substituteId of ingredient.substitutes) {
        const substitute = await this.getById(substituteId);
        if (substitute) {
          substitutes.push(substitute);
        }
      }

      return substitutes;
    }, `Failed to get substitutes for ingredient ${id}`);
  },

  /**
   * Find ingredients that can be substituted by the specified ingredient
   *
   * @param id Ingredient ID
   * @returns Array of ingredients that can be substituted
   * @throws {DatabaseError} If the database operation fails
   */
  async getSubstituteFor(id: string): Promise<Ingredient[]> {
    return await executeDbOperation(async () => {
      const substituteFors: Ingredient[] = [];

      for await (
        const entry of kv.list<boolean>({
          prefix: ["ingredient_substitute_for", id],
        })
      ) {
        const ingredientId = entry.key[2] as string;
        const ingredient = await this.getById(ingredientId);

        if (ingredient) {
          substituteFors.push(ingredient);
        }
      }

      return substituteFors;
    }, `Failed to get substitute-for relationships for ingredient ${id}`);
  },

  /**
   * Get all ingredients with a specific allergen
   *
   * @param allergen Allergen to filter by
   * @param limit Maximum number of ingredients to return
   * @param offset Number of ingredients to skip
   * @returns Array of matching ingredients
   * @throws {DatabaseError} If the database operation fails
   */
  async getByAllergen(
    allergen: string,
    limit = 20,
    offset = 0,
  ): Promise<Ingredient[]> {
    return await executeDbOperation(async () => {
      const ingredients: Ingredient[] = [];
      let count = 0;

      for await (
        const entry of kv.list<boolean>({
          prefix: ["ingredient_allergen", allergen],
        })
      ) {
        if (count >= offset && ingredients.length < limit) {
          const ingredientId = entry.key[2] as string;
          const ingredient = await this.getById(ingredientId);

          if (ingredient) {
            ingredients.push(ingredient);
          }
        }
        count++;

        if (ingredients.length >= limit) {
          break;
        }
      }

      return ingredients;
    }, `Failed to get ingredients by allergen ${allergen}`);
  },

  /**
   * Get all recipes that use a specific ingredient
   *
   * @param id Ingredient ID
   * @param limit Maximum number of recipe IDs to return
   * @param offset Number of recipe IDs to skip
   * @returns Array of recipe IDs
   * @throws {DatabaseError} If the database operation fails
   */
  async getRecipeIds(
    id: string,
    limit = 20,
    offset = 0,
  ): Promise<string[]> {
    return await executeDbOperation(async () => {
      const recipeIds: string[] = [];
      let count = 0;

      for await (
        const entry of kv.list<boolean>({ prefix: ["ingredient_recipes", id] })
      ) {
        if (count >= offset && recipeIds.length < limit) {
          const recipeId = entry.key[2] as string;
          recipeIds.push(recipeId);
        }
        count++;

        if (recipeIds.length >= limit) {
          break;
        }
      }

      return recipeIds;
    }, `Failed to get recipes for ingredient ${id}`);
  },
};
