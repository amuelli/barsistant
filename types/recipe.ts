/**
 * Recipe type definitions for the Barsistant application
 *
 * These types define the structure of cocktail recipe data
 * as stored in the Deno KV database.
 */

import { MeasurementUnit } from "./ingredient.ts";

/**
 * Color palette extracted from an image
 */
export interface ColorPalette {
  vibrant?: string;
  darkVibrant?: string;
  lightVibrant?: string;
  muted?: string;
  darkMuted?: string;
  lightMuted?: string;
}

/**
 * Represents a single ingredient within a recipe with its amount information
 */
export interface RecipeIngredient {
  ingredientId: string;
  name: string; // Ingredient display name (copied from Ingredient at creation time)
  quantity: number;
  unit: MeasurementUnit;
  optional: boolean;
  notes?: string; // e.g. preferred brand
}

/**
 * Recipe visibility options
 */
export type RecipeVisibility = "private" | "public";

/**
 * Represents a complete cocktail recipe
 */
export interface Recipe {
  id: string;
  name: string;
  description: string;
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
      colorPalette?: ColorPalette; // Color palette extracted from the raster image
    };
    vector?: {
      url?: string;
      status: "none" | "generating" | "done" | "failed";
      error?: string;
    };
  };
  tags: string[];
  rating?: number; // Average user rating
  createdBy?: string; // User ID of recipe creator (optional for backward compatibility)
  visibility?: RecipeVisibility; // Recipe privacy setting (default: "private")
  originalRecipeId?: string; // Source recipe if copied from another recipe
  publicRecipeId?: string; // Public recipe ID if this private recipe was made public
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
