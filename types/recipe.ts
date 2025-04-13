/**
 * Recipe type definitions for the Barsistant application
 *
 * These types define the structure of cocktail recipe data
 * as stored in the Deno KV database.
 */

import { MeasurementUnit } from "./ingredient.ts";

/**
 * Represents a single ingredient within a recipe with its amount information
 */
export interface RecipeIngredient {
  ingredientId: string;
  quantity: string;
  unit: MeasurementUnit;
  optional: boolean;
  notes?: string;
  substitutes?: string[]; // IDs of substitute ingredients
}

/**
 * Represents a complete cocktail recipe
 */
export interface Recipe {
  id: string;
  name: string;
  description: string;
  strength: number; // Scale of 1-10
  sweetness: number; // Scale of 1-10 (1 = very sour, 10 = very sweet)
  ingredients: RecipeIngredient[]; // Array of ingredients with their quantities
  garnish: string[];
  glassware: string;
  preparation: string[];
  source: {
    name: string;
    url?: string;
  };
  tags: string[];
  image?: string;
  rating?: number; // Average user rating
  calories?: number;
  alcoholContent?: {
    percentage: number;
    standardDrinks: number;
  };
  allergens?: string[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
