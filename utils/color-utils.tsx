import { Recipe } from "../types/recipe.ts";

/**
 * Get a gradient background CSS value from a recipe's color palette
 *
 * @param recipe The recipe object containing color palette data
 * @returns CSS linear gradient value using colors from the recipe's palette or fallbacks
 */
export function getGradientBackground(recipe: Recipe): string {
  const lightColor = recipe.images?.raster?.colorPalette?.lightVibrant ||
    "#f0f0f0";
  const darkColor = recipe.images?.raster?.colorPalette?.vibrant || "#cccccc";
  return `linear-gradient(to bottom, ${lightColor}, ${darkColor})`;
}
