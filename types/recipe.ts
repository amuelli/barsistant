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
  name: string; // Ingredient display name (copied from Ingredient at creation time)
  quantity: number;
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
  glassware: GlasswareType;
  preparation: string[];
  source: {
    name: string;
    url?: string;
    image?: string; // The image URL extracted from the original source (website, blog, etc.)
  };
  images?: {
    raster?: {
      url?: string;
      status: "none" | "generating" | "done" | "failed";
      error?: string;
    };
    vector?: {
      url?: string;
      status: "none" | "generating" | "done" | "failed";
      error?: string;
    };
  };
  tags: string[];
  rating?: number; // Average user rating
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export type GlasswareType =
  | "collins"
  | "coupe"
  | "fizz"
  | "highball"
  | "hurricane"
  | "irish-coffee"
  | "margarita"
  | "martini"
  | "nick-and-nora"
  | "old-fashioned"
  | "rocks"
  | "shot"
  | "sour"
  | "wine";
