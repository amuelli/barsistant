/**
 * Ingredient type definitions for the Barsistant application
 *
 * These types define the structure of cocktail ingredients data
 * as stored in the Deno KV database.
 */

/**
 * Available measurement units
 */
export const MEASUREMENT_UNITS = [
  "ml",
  "oz",
  "cl",
  "dash",
  "drop",
  "barspoon",
  "tsp",
  "tbsp",
  "cup",
  "pint",
  "part",
  "piece",
  "slice",
  "whole",
  "pinch",
  "spritz",
  "leaf",
  "sprig",
  "rim",
  "count",
] as const;

/**
 * Represents an ingredient measurement unit
 */
export type MeasurementUnit = typeof MEASUREMENT_UNITS[number];

/**
 * Available ingredient types
 */
export const INGREDIENT_TYPES = [
  "spirit",
  "liqueur",
  "wine",
  "fortified_wine",
  "mixer",
  "juice",
  "syrup",
  "bitter",
  "fruit",
  "herb",
  "spice",
  "other",
] as const;

/**
 * Represents a type of ingredient
 */
export type IngredientType = typeof INGREDIENT_TYPES[number];

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
  origin?: string; // Where the ingredient is typically sourced from
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

/**
 * Helper function to get appropriate measurement units based on ingredient type
 */
const measurementUnitsByType: Record<IngredientType, MeasurementUnit[]> = {
  spirit: ["ml", "oz", "cl"],
  liqueur: ["ml", "oz", "cl"],
  wine: ["ml", "oz", "cl"],
  fortified_wine: ["ml", "oz", "cl"],
  juice: ["ml", "oz", "dash", "cl"],
  syrup: ["ml", "oz", "dash", "cl"],
  mixer: ["ml", "oz", "dash", "cl"],
  bitter: ["drop", "dash"],
  herb: ["pinch", "sprig", "leaf"],
  spice: ["pinch", "sprig", "leaf"],
  fruit: ["piece", "slice", "whole"],
  other: ["ml", "oz", "cl"],
};

export function getMeasurementsForType(
  type: IngredientType,
): MeasurementUnit[] {
  return measurementUnitsByType[type] ?? ["ml", "oz", "dash"];
}
