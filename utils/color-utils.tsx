import { Recipe } from "../types/recipe.ts";

/**
 * Get the background color from a recipe's color palette
 *
 * @param recipe The recipe object containing color palette data
 * @returns The color to use for the background
 */
export function getBackgroundColor(recipe: Recipe): string {
  return recipe.images?.raster?.colorPalette?.lightVibrant ||
    recipe.images?.raster?.colorPalette?.muted ||
    "#ccc"; // Fallback color
}
