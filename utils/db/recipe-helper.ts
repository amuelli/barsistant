/// <reference lib="deno.unstable" />

/**
 * Recipe Helper Module for Barsistant
 *
 * This module provides helper functions for recipe creation with JIT (Just-In-Time)
 * ingredient creation. It simplifies creating recipes with ingredients that
 * don't exist yet in the database.
 */

import type {
  Ingredient,
  IngredientType,
  MeasurementUnit,
} from "../../types/ingredient.ts";
import type { Recipe, RecipeIngredient } from "../../types/recipe.ts";
import { executeDbOperation, kv } from "./db.ts";
import { ingredientModel } from "./ingredient-model.ts";
import type { CreateRecipeParams, UpdateRecipeParams } from "./recipe-model.ts";
import { recipeModel } from "./recipe-model.ts";

/**
 * Simple ingredient specification for JIT creation
 */
export interface SimpleIngredient {
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  optional?: boolean;
  notes?: string;
  type: IngredientType;
  description?: string;
  abv?: number;
  commonMeasurements?: MeasurementUnit[];
  allergens?: string[];
  image?: string;
}

/**
 * Recipe creation parameters with simple ingredient names
 */
export interface CreateRecipeWithSimpleIngredientsParams
  extends Omit<CreateRecipeParams, "ingredients"> {
  ingredients: SimpleIngredient[];
}

/**
 * Recipe update parameters with simple ingredient names
 */
export interface UpdateRecipeWithSimpleIngredientsParams
  extends Omit<UpdateRecipeParams, "ingredients"> {
  ingredients?: SimpleIngredient[];
}

/**
 * Creates a recipe with ingredients that may not exist yet.
 * For each ingredient, it will:
 * 1. Check if an ingredient with the same name exists
 * 2. If it exists, use that ingredient's ID
 * 3. If it doesn't exist, create a new ingredient with sensible defaults
 *
 * @param params Recipe creation parameters with simple ingredients
 * @returns The created recipe
 */
export async function createRecipeWithSimpleIngredients(
  params: CreateRecipeWithSimpleIngredientsParams,
): Promise<Recipe> {
  return await executeDbOperation(async () => {
    // Process each ingredient
    const processedIngredients: RecipeIngredient[] = [];
    const ingredientNameMap = new Map<string, string>(); // Maps ingredient names to IDs

    for (const simpleIngredient of params.ingredients) {
      // Try to find existing ingredient by name
      const existingIngredient = await findIngredientByName(
        simpleIngredient.name,
      );

      let ingredientId: string;
      let ingredientName: string = simpleIngredient.name;

      if (existingIngredient) {
        // Use existing ingredient
        ingredientId = existingIngredient.id;
        ingredientName = existingIngredient.name;
      } else {
        // Create new ingredient with sensible defaults
        const newIngredient = await ingredientModel.create({
          name: simpleIngredient.name,
          description: simpleIngredient.description ||
            `${simpleIngredient.name} for cocktails`,
          type: simpleIngredient.type,
          commonMeasurements: simpleIngredient.commonMeasurements ||
            [simpleIngredient.unit],
          abv: simpleIngredient.abv,
          allergens: simpleIngredient.allergens,
          image: simpleIngredient.image,
        });

        ingredientId = newIngredient.id;
        ingredientName = newIngredient.name;
      }

      // Store for later use
      ingredientNameMap.set(simpleIngredient.name, ingredientId);

      // Add to processed ingredients
      processedIngredients.push({
        ingredientId,
        name: ingredientName,
        quantity: simpleIngredient.quantity,
        unit: simpleIngredient.unit,
        optional: simpleIngredient.optional ?? false,
        notes: simpleIngredient.notes,
      });
    }

    // Create the recipe with processed ingredients
    const recipe = await recipeModel.create({
      ...params,
      ingredients: processedIngredients,
    });

    return recipe;
  }, "Failed to create recipe with simple ingredients");
}

/**
 * Updates a recipe with simple ingredient names rather than IDs
 *
 * @param id Recipe ID to update
 * @param params Update parameters with simple ingredients
 * @returns The updated recipe
 */
export async function updateRecipeWithSimpleIngredients(
  id: string,
  params: UpdateRecipeWithSimpleIngredientsParams,
): Promise<Recipe> {
  return await executeDbOperation(async () => {
    // If no ingredient updates, just do a regular update without the ingredients property
    if (!params.ingredients) {
      // Create a new object without the ingredients property to satisfy the type checker
      const { ingredients: _ingredients, ...updateParams } = params;
      return await recipeModel.update(id, updateParams);
    }

    // Process each ingredient
    const processedIngredients: RecipeIngredient[] = [];

    for (const simpleIngredient of params.ingredients) {
      // Try to find existing ingredient by name
      const existingIngredient = await findIngredientByName(
        simpleIngredient.name,
      );

      let ingredientId: string;
      let ingredientName: string = simpleIngredient.name;

      if (existingIngredient) {
        // Use existing ingredient
        ingredientId = existingIngredient.id;
        ingredientName = existingIngredient.name;
      } else {
        // Create new ingredient with sensible defaults
        const newIngredient = await ingredientModel.create({
          name: simpleIngredient.name,
          description: simpleIngredient.description ||
            `${simpleIngredient.name} for cocktails`,
          type: simpleIngredient.type,
          commonMeasurements: simpleIngredient.commonMeasurements ||
            [simpleIngredient.unit],
          abv: simpleIngredient.abv,
          allergens: simpleIngredient.allergens,
          image: simpleIngredient.image,
        });

        ingredientId = newIngredient.id;
        ingredientName = newIngredient.name;
      }

      // Add to processed ingredients
      processedIngredients.push({
        ingredientId,
        name: ingredientName,
        quantity: simpleIngredient.quantity,
        unit: simpleIngredient.unit,
        optional: simpleIngredient.optional ?? false,
        notes: simpleIngredient.notes,
      });
    }

    // Update the recipe with processed ingredients
    const recipe = await recipeModel.update(id, {
      ...params,
      ingredients: processedIngredients,
    });

    return recipe;
  }, `Failed to update recipe ${id} with simple ingredients`);
}

/**
 * Find an ingredient by name, case-insensitive
 *
 * @param name Ingredient name to search for
 * @returns Ingredient or null if not found
 */
export async function findIngredientByName(
  name: string,
): Promise<Ingredient | null> {
  return await executeDbOperation(async () => {
    const normalizedName = name.toLowerCase().trim();

    // Search for ingredients by normalized name
    for await (const entry of kv.list<Ingredient>({ prefix: ["ingredient"] })) {
      const ingredient = entry.value;
      if (ingredient.name.toLowerCase() === normalizedName) {
        return ingredient;
      }
    }

    return null;
  }, `Failed to find ingredient by name: ${name}`);
}

/**
 * Find or create an ingredient by name
 *
 * @param ingredientInfo Simple ingredient information
 * @returns The found or created ingredient
 */
export async function findOrCreateIngredient(
  ingredientInfo: {
    name: string;
    type: IngredientType;
    description?: string;
    commonMeasurements?: MeasurementUnit[];
    abv?: number;
    allergens?: string[];
    image?: string;
  },
): Promise<Ingredient> {
  return await executeDbOperation(async () => {
    // Try to find existing ingredient by name
    const existingIngredient = await findIngredientByName(ingredientInfo.name);

    if (existingIngredient) {
      return existingIngredient;
    }

    // Create new ingredient
    const newIngredient = await ingredientModel.create({
      name: ingredientInfo.name,
      description: ingredientInfo.description ||
        `${ingredientInfo.name} for cocktails`,
      type: ingredientInfo.type,
      commonMeasurements: ingredientInfo.commonMeasurements || ["oz", "ml"],
      abv: ingredientInfo.abv,
      allergens: ingredientInfo.allergens,
      image: ingredientInfo.image,
    });

    return newIngredient;
  }, `Failed to find or create ingredient: ${ingredientInfo.name}`);
}

/**
 * Get all recipes that use an ingredient by name
 *
 * @param name Ingredient name
 * @param limit Maximum number of recipes to return
 * @param offset Number of recipes to skip
 * @returns Array of recipes
 */
export async function getRecipesByIngredientName(
  name: string,
  limit = 20,
  offset = 0,
): Promise<Recipe[]> {
  return await executeDbOperation(async () => {
    const ingredient = await findIngredientByName(name);

    if (!ingredient) {
      return [];
    }

    return await recipeModel.getByIngredient(ingredient.id, limit, offset);
  }, `Failed to get recipes by ingredient name: ${name}`);
}

/**
 * Create an ingredient lookup table (name -> ID) for multiple ingredients
 *
 * @param names Array of ingredient names to look up
 * @returns Map of ingredient names to IDs
 */
export async function createIngredientNameMap(
  names: string[],
): Promise<Map<string, string>> {
  return await executeDbOperation(async () => {
    const nameMap = new Map<string, string>();

    for (const name of names) {
      const ingredient = await findIngredientByName(name);
      if (ingredient) {
        nameMap.set(name, ingredient.id);
      }
    }

    return nameMap;
  }, "Failed to create ingredient name map");
}
