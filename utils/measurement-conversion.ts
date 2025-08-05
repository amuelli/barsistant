/**
 * Measurement conversion utilities for the Barsistant application
 * 
 * Provides functions to convert between different measurement units,
 * specifically focusing on oz ↔ ml conversion with precise calculations
 * and proper rounding for display purposes.
 */

import { MeasurementUnit } from "../types/ingredient.ts";
import { RecipeIngredient } from "../types/recipe.ts";

/**
 * US fluid ounce to milliliter conversion factor
 * 1 US fluid ounce = 29.5735 milliliters (exact)
 */
export const OZ_TO_ML_FACTOR = 29.5735;

/**
 * Units that can be converted between oz and ml
 */
const CONVERTIBLE_UNITS: Set<MeasurementUnit> = new Set(["oz", "ml"]);

/**
 * Units that should not be converted (preserved as-is)
 */
const NON_CONVERTIBLE_UNITS: Set<MeasurementUnit> = new Set([
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
]);

/**
 * Convert a measurement from one unit to another
 * 
 * Only converts between oz and ml. All other units are preserved as-is.
 * Results are rounded to 1 decimal place for display purposes.
 * 
 * @param quantity The quantity to convert
 * @param fromUnit The source unit
 * @param toUnit The target unit
 * @returns Object with converted quantity and unit
 */
export function convertMeasurement(
  quantity: number,
  fromUnit: MeasurementUnit,
  toUnit: MeasurementUnit,
): { quantity: number; unit: MeasurementUnit } {
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) {
    return { quantity, unit: fromUnit };
  }

  // If either unit is non-convertible, preserve original
  if (NON_CONVERTIBLE_UNITS.has(fromUnit) || NON_CONVERTIBLE_UNITS.has(toUnit)) {
    return { quantity, unit: fromUnit };
  }

  // Only convert between oz and ml
  if (!CONVERTIBLE_UNITS.has(fromUnit) || !CONVERTIBLE_UNITS.has(toUnit)) {
    return { quantity, unit: fromUnit };
  }

  let convertedQuantity: number;

  if (fromUnit === "oz" && toUnit === "ml") {
    // Convert oz to ml
    convertedQuantity = quantity * OZ_TO_ML_FACTOR;
  } else if (fromUnit === "ml" && toUnit === "oz") {
    // Convert ml to oz
    convertedQuantity = quantity / OZ_TO_ML_FACTOR;
  } else {
    // No conversion possible
    return { quantity, unit: fromUnit };
  }

  // Round to 1 decimal place for display
  const roundedQuantity = Math.round(convertedQuantity * 10) / 10;

  return {
    quantity: roundedQuantity,
    unit: toUnit,
  };
}

/**
 * Display a recipe ingredient measurement in the user's preferred unit
 * 
 * Converts the ingredient's measurement to the user's preferred unit if possible.
 * Non-convertible units are preserved as-is.
 * 
 * @param ingredient The recipe ingredient with quantity and unit
 * @param userPreference The user's preferred measurement unit ("oz" or "ml")
 * @returns Object with quantity and unit adjusted for user preference
 */
export function displayMeasurementForUser(
  ingredient: RecipeIngredient,
  userPreference: "oz" | "ml",
): { quantity: number; unit: MeasurementUnit } {
  return convertMeasurement(ingredient.quantity, ingredient.unit, userPreference);
}