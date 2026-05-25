/**
 * Recipe display utilities for the Barsistant application
 *
 * Provides functions to display recipe ingredients with user preference-based
 * measurement conversions while preserving all other recipe data.
 */

import { RecipeIngredient } from "../types/recipe.ts";
import { User } from "../types/user.ts";
import { displayMeasurementForUser } from "./measurement-conversion.ts";

/**
 * Display a recipe ingredient with measurements converted to user's preferred unit
 *
 * @param ingredient The recipe ingredient to display
 * @param user The user (optional) - if provided, measurements will be converted to their preference
 * @returns Object with formatted display information
 */
export function displayIngredientForUser(
  ingredient: RecipeIngredient,
  user?: User | null,
): {
  quantity: number;
  unit: string;
  name: string;
  optional: boolean;
  notes?: string;
  originalQuantity: number;
  originalUnit: string;
} {
  let displayQuantity = ingredient.quantity;
  let displayUnit = ingredient.unit;

  // Convert measurements if user has a preference
  if (user?.preferences?.preferredMeasurementUnit) {
    const converted = displayMeasurementForUser(
      ingredient,
      user.preferences.preferredMeasurementUnit,
    );
    displayQuantity = converted.quantity;
    displayUnit = converted.unit;
  }

  return {
    quantity: displayQuantity,
    unit: displayUnit,
    name: ingredient.name,
    optional: ingredient.optional,
    notes: ingredient.notes,
    originalQuantity: ingredient.quantity,
    originalUnit: ingredient.unit,
  };
}

/**
 * Get formatted measurement text for display
 *
 * @param quantity The quantity to display
 * @param unit The unit to display
 * @returns Formatted string like "2 oz" or "60 ml"
 */
export function formatMeasurement(quantity: number, unit: string): string {
  // Handle zero and very small quantities
  if (quantity === 0) {
    return `0 ${unit}`;
  }

  // Format quantity with appropriate precision
  const formattedQuantity = quantity % 1 === 0
    ? quantity.toString()
    : quantity.toFixed(1);

  return `${formattedQuantity} ${unit}`;
}

/**
 * Display all ingredients in a recipe with user preference conversions
 *
 * @param ingredients Array of recipe ingredients
 * @param user The user (optional) - if provided, measurements will be converted
 * @returns Array of display-ready ingredients
 */
export function displayIngredientsForUser(
  ingredients: RecipeIngredient[],
  user?: User | null,
) {
  return ingredients.map((ingredient) =>
    displayIngredientForUser(ingredient, user)
  );
}
