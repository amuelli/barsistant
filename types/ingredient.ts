/**
 * Ingredient type definitions for the Barsistant application
 *
 * These types define the structure of cocktail ingredients data
 * as stored in the Deno KV database.
 */

/**
 * Represents an ingredient measurement unit
 */
export type MeasurementUnit =
  | "ml"
  | "oz"
  | "cl"
  | "dash"
  | "drop"
  | "barspoon"
  | "tsp"
  | "tbsp"
  | "cup"
  | "pint"
  | "part"
  | "piece"
  | "slice"
  | "whole"
  | "pinch"
  | "spritz"
  | "leaf"
  | "sprig"
  | "rim";

/**
 * Represents a type of ingredient
 */
export type IngredientType =
  | "spirit"
  | "liqueur"
  | "wine"
  | "mixer"
  | "juice"
  | "syrup"
  | "bitter"
  | "fruit"
  | "herb"
  | "spice"
  | "other";

/**
 * Represents a standalone ingredient in the database
 * (as opposed to an ingredient used in a specific recipe)
 */
export interface Ingredient {
  id: string;
  name: string;
  description: string;
  type: IngredientType;
  abv?: number; // Alcohol by volume percentage
  commonMeasurements: MeasurementUnit[];
  substitutes?: string[]; // IDs of substitute ingredients
  image?: string;
  allergens?: string[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Represents the database relationship between a recipe and an ingredient
 *
 * This is used internally for database relationship tracking and
 * should not be confused with the RecipeIngredient interface in recipe.ts
 * which is used in the Recipe object itself.
 */
export interface IngredientRecipeLink {
  recipeId: string;
  ingredientId: string;
  quantity: number;
  unit: MeasurementUnit;
  optional: boolean;
  notes?: string;
}
