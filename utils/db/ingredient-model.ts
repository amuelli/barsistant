/// <reference lib="deno.unstable" />

/**
 * Ingredient model implementation for the Barsistant application
 *
 * This module provides CRUD operations for ingredients, managing both
 * primary records and related indexes.
 */

import { ulid } from "@std/ulid";
import { Ingredient, IngredientType } from "../../types/ingredient.ts";
import {
  executeDbOperation,
  type IngredientAllergenKey,
  type IngredientKey,
  type IngredientSearchKey,
  type IngredientTypeKey,
  kv,
} from "./db.ts";

/**
 * Ingredient creation parameters
 */
export type CreateIngredientParams = Omit<
  Ingredient,
  "id" | "createdAt" | "updatedAt"
>;

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

      // Generate unique ID
      const id = ulid();
      const now = new Date().toISOString();

      // Create ingredient object
      const ingredient: Ingredient = {
        id,
        name: params.name.trim(),
        description: params.description || "",
        type: params.type,
        createdAt: now,
        updatedAt: now,
      };

      // Add optional fields
      if (params.abv !== undefined) ingredient.abv = params.abv;
      if (params.image) ingredient.image = params.image;
      if (params.allergens) ingredient.allergens = params.allergens;

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Add the main ingredient entry
      const ingredientKey: IngredientKey = ["ingredient", id];
      transaction.set(ingredientKey, ingredient);

      // Create secondary indexes

      // Add type index for quick lookups by ingredient type
      const ingredientTypeKey: IngredientTypeKey = [
        "ingredient_type",
        params.type,
        id,
      ];
      transaction.set(ingredientTypeKey, true);

      // Add search terms for case-insensitive search
      const searchableTerms = params.name.toLowerCase().split(/\s+/);
      for (const term of searchableTerms) {
        const ingredientSearchKey: IngredientSearchKey = [
          "ingredient_search",
          term,
          id,
        ];
        transaction.set(ingredientSearchKey, true);
      }

      // If there are allergens, create indexes for them
      if (params.allergens && params.allergens.length > 0) {
        for (const allergen of params.allergens) {
          const ingredientAllergenKey: IngredientAllergenKey = [
            "ingredient_allergen",
            allergen,
            id,
          ];
          transaction.set(ingredientAllergenKey, true);
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
      const ingredientKey: IngredientKey = ["ingredient", id];
      const result = await kv.get<Ingredient>(ingredientKey);
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
      const getIngredientKey: IngredientKey = ["ingredient", id];
      const result = await kv.get<Ingredient>(getIngredientKey);

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
      const updateIngredientKey: IngredientKey = ["ingredient", id];
      transaction.set(updateIngredientKey, updatedIngredient);

      // If type changed, update type indexes
      if (params.type && params.type !== existingIngredient.type) {
        const oldIngredientTypeKey: IngredientTypeKey = [
          "ingredient_type",
          existingIngredient.type,
          id,
        ];
        const newIngredientTypeKey: IngredientTypeKey = [
          "ingredient_type",
          updatedIngredient.type,
          id,
        ];
        transaction.delete(oldIngredientTypeKey);
        transaction.set(newIngredientTypeKey, true);
      }

      // If name changed, update search terms
      if (params.name) {
        // Get old search terms
        const oldSearchableTerms = existingIngredient.name.toLowerCase().split(
          /\s+/,
        );

        // Delete old search term indexes
        for (const term of oldSearchableTerms) {
          const oldIngredientSearchKey: IngredientSearchKey = [
            "ingredient_search",
            term,
            id,
          ];
          transaction.delete(oldIngredientSearchKey);
        }

        // Add new search term indexes
        const newSearchableTerms = updatedIngredient.name.toLowerCase().split(
          /\s+/,
        );
        for (const term of newSearchableTerms) {
          const newIngredientSearchKey: IngredientSearchKey = [
            "ingredient_search",
            term,
            id,
          ];
          transaction.set(newIngredientSearchKey, true);
        }
      }

      // If allergens changed, update allergen indexes
      if (params.allergens !== undefined) {
        // Clean up old allergen relationships
        if (existingIngredient.allergens) {
          for (const allergen of existingIngredient.allergens) {
            const oldIngredientAllergenKey: IngredientAllergenKey = [
              "ingredient_allergen",
              allergen,
              id,
            ];
            transaction.delete(oldIngredientAllergenKey);
          }
        }

        // Create new allergen relationships
        if (params.allergens && params.allergens.length > 0) {
          for (const allergen of params.allergens) {
            const newIngredientAllergenKey: IngredientAllergenKey = [
              "ingredient_allergen",
              allergen,
              id,
            ];
            transaction.set(newIngredientAllergenKey, true);
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
      const deleteCheckKey: IngredientKey = ["ingredient", id];
      const result = await kv.get<Ingredient>(deleteCheckKey);

      if (!result.value) {
        return false;
      }

      const existingIngredient = result.value;

      // Start a transaction for atomic operations
      const transaction = kv.atomic();

      // Delete the main ingredient entry
      const deleteIngredientKey: IngredientKey = ["ingredient", id];
      transaction.delete(deleteIngredientKey);

      // Delete type index
      const ingredientTypeKey: IngredientTypeKey = [
        "ingredient_type",
        existingIngredient.type,
        id,
      ];
      transaction.delete(ingredientTypeKey);

      // Delete search term indexes
      const searchableTerms = existingIngredient.name.toLowerCase().split(
        /\s+/,
      );
      for (const term of searchableTerms) {
        const ingredientSearchKey: IngredientSearchKey = [
          "ingredient_search",
          term,
          id,
        ];
        transaction.delete(ingredientSearchKey);
      }

      // Delete allergen indexes
      if (
        existingIngredient.allergens && existingIngredient.allergens.length > 0
      ) {
        for (const allergen of existingIngredient.allergens) {
          const ingredientAllergenKey: IngredientAllergenKey = [
            "ingredient_allergen",
            allergen,
            id,
          ];
          transaction.delete(ingredientAllergenKey);
        }
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
   * Find an ingredient by name, case-insensitive
   *
   * @param name Ingredient name to search for
   * @returns Ingredient or null if not found
   */
  async findByName(name: string): Promise<Ingredient | null> {
    return await executeDbOperation(async () => {
      const normalizedName = name.toLowerCase().trim();
      for await (
        const entry of kv.list<Ingredient>({ prefix: ["ingredient"] })
      ) {
        const ingredient = entry.value;
        if (ingredient.name.toLowerCase() === normalizedName) {
          return ingredient;
        }
      }
      return null;
    }, `Failed to find ingredient by name: ${name}`);
  },

  /**
   * Find or create an ingredient by name
   *
   * @param ingredientInfo Simple ingredient information
   * @returns The found or created ingredient
   */
  async findOrCreate(ingredientInfo: {
    name: string;
    type: IngredientType;
    description?: string;
    abv?: number;
    allergens?: string[];
    image?: string;
  }): Promise<Ingredient> {
    return await executeDbOperation(async () => {
      const existing = await this.findByName(ingredientInfo.name);
      if (existing) return existing;
      // Create new ingredient
      return await this.create({
        name: ingredientInfo.name,
        description: ingredientInfo.description ||
          `${ingredientInfo.name} for cocktails`,
        type: ingredientInfo.type,
        abv: ingredientInfo.abv,
        allergens: ingredientInfo.allergens,
        image: ingredientInfo.image,
      });
    }, `Failed to find or create ingredient: ${ingredientInfo.name}`);
  },

  /**
   * List all ingredients (raw iterator, for internal use)
   * @returns AsyncIterable<{ key: Deno.KvKey; value: Ingredient }>
   */
  list(): AsyncIterable<{ key: Deno.KvKey; value: Ingredient }> {
    return kv.list<Ingredient>({ prefix: ["ingredient"] });
  },
};
