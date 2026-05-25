import { assertEquals } from "@std/assert";
import { MeasurementUnit } from "../types/ingredient.ts";
import { RecipeIngredient } from "../types/recipe.ts";
import {
  convertMeasurement,
  displayMeasurementForUser,
  OZ_TO_ML_FACTOR,
} from "./measurement-conversion.ts";

/**
 * Test suite for measurement conversion utilities
 */
Deno.test("measurement-conversion", async (t) => {
  await t.step("convertMeasurement should convert oz to ml correctly", () => {
    const result = convertMeasurement(2, "oz", "ml");
    assertEquals(result.quantity, 59.1); // 2 * 29.5735 = 59.147, rounded to 1 decimal
    assertEquals(result.unit, "ml");
  });

  await t.step("convertMeasurement should convert ml to oz correctly", () => {
    const result = convertMeasurement(60, "ml", "oz");
    assertEquals(result.quantity, 2.0); // 60 / 29.5735 = 2.029, rounded to 1 decimal
    assertEquals(result.unit, "oz");
  });

  await t.step("convertMeasurement should handle edge cases", () => {
    // Test very small quantities
    const smallResult = convertMeasurement(0.1, "oz", "ml");
    assertEquals(smallResult.quantity, 3.0); // 0.1 * 29.5735 = 2.95735, rounded to 1 decimal
    assertEquals(smallResult.unit, "ml");

    // Test very large quantities
    const largeResult = convertMeasurement(100, "ml", "oz");
    assertEquals(largeResult.quantity, 3.4); // 100 / 29.5735 = 3.3814, rounded to 1 decimal
    assertEquals(largeResult.unit, "oz");
  });

  await t.step("convertMeasurement should handle zero quantities", () => {
    const result = convertMeasurement(0, "oz", "ml");
    assertEquals(result.quantity, 0);
    assertEquals(result.unit, "ml");
  });

  await t.step(
    "convertMeasurement should preserve non-convertible units",
    () => {
      const units: MeasurementUnit[] = [
        "dash",
        "drop",
        "barspoon",
        "tsp",
        "tbsp",
        "pinch",
        "spritz",
      ];

      units.forEach((unit) => {
        const result = convertMeasurement(2, unit, "ml");
        assertEquals(result.quantity, 2);
        assertEquals(result.unit, unit);
      });
    },
  );

  await t.step("convertMeasurement should handle same unit conversion", () => {
    const ozToOz = convertMeasurement(2, "oz", "oz");
    assertEquals(ozToOz.quantity, 2);
    assertEquals(ozToOz.unit, "oz");

    const mlToMl = convertMeasurement(60, "ml", "ml");
    assertEquals(mlToMl.quantity, 60);
    assertEquals(mlToMl.unit, "ml");
  });

  await t.step(
    "convertMeasurement should use correct conversion factor",
    () => {
      // Verify the conversion factor is correct (1 oz = 29.5735 ml)
      assertEquals(OZ_TO_ML_FACTOR, 29.5735);

      const result = convertMeasurement(1, "oz", "ml");
      assertEquals(result.quantity, 29.6); // 29.5735 rounded to 1 decimal
    },
  );

  await t.step(
    "displayMeasurementForUser should convert based on user preference",
    () => {
      const ingredient: RecipeIngredient = {
        ingredientId: "test-id",
        name: "Test Ingredient",
        quantity: 2,
        unit: "oz",
        optional: false,
      };

      // User prefers ml, ingredient is in oz - should convert
      const mlResult = displayMeasurementForUser(ingredient, "ml");
      assertEquals(mlResult.quantity, 59.1);
      assertEquals(mlResult.unit, "ml");

      // User prefers oz, ingredient is in oz - should not convert
      const ozResult = displayMeasurementForUser(ingredient, "oz");
      assertEquals(ozResult.quantity, 2);
      assertEquals(ozResult.unit, "oz");
    },
  );

  await t.step(
    "displayMeasurementForUser should handle ml to oz conversion",
    () => {
      const ingredient: RecipeIngredient = {
        ingredientId: "test-id",
        name: "Test Ingredient",
        quantity: 60,
        unit: "ml",
        optional: false,
      };

      // User prefers oz, ingredient is in ml - should convert
      const ozResult = displayMeasurementForUser(ingredient, "oz");
      assertEquals(ozResult.quantity, 2.0);
      assertEquals(ozResult.unit, "oz");

      // User prefers ml, ingredient is in ml - should not convert
      const mlResult = displayMeasurementForUser(ingredient, "ml");
      assertEquals(mlResult.quantity, 60);
      assertEquals(mlResult.unit, "ml");
    },
  );

  await t.step(
    "displayMeasurementForUser should preserve non-convertible units",
    () => {
      const ingredient: RecipeIngredient = {
        ingredientId: "test-id",
        name: "Test Ingredient",
        quantity: 3,
        unit: "dash",
        optional: false,
      };

      // Non-convertible units should remain unchanged regardless of preference
      const mlResult = displayMeasurementForUser(ingredient, "ml");
      assertEquals(mlResult.quantity, 3);
      assertEquals(mlResult.unit, "dash");

      const ozResult = displayMeasurementForUser(ingredient, "oz");
      assertEquals(ozResult.quantity, 3);
      assertEquals(ozResult.unit, "dash");
    },
  );

  await t.step(
    "displayMeasurementForUser should handle edge cases with precision",
    () => {
      const ingredient: RecipeIngredient = {
        ingredientId: "test-id",
        name: "Test Ingredient",
        quantity: 0.25,
        unit: "oz",
        optional: false,
      };

      // 0.25 oz = 7.39 ml (rounded to 1 decimal)
      const result = displayMeasurementForUser(ingredient, "ml");
      assertEquals(result.quantity, 7.4);
      assertEquals(result.unit, "ml");
    },
  );

  await t.step(
    "displayMeasurementForUser should handle quantities that round to zero",
    () => {
      const ingredient: RecipeIngredient = {
        ingredientId: "test-id",
        name: "Test Ingredient",
        quantity: 0.01,
        unit: "ml",
        optional: false,
      };

      // 0.01 ml = 0.0003 oz, should round to 0.0
      const result = displayMeasurementForUser(ingredient, "oz");
      assertEquals(result.quantity, 0.0);
      assertEquals(result.unit, "oz");
    },
  );
});
