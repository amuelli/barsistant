import { assertEquals } from "@std/assert";
import { RecipeIngredient } from "../types/recipe.ts";
import { User } from "../types/user.ts";
import {
  displayIngredientForUser,
  displayIngredientsForUser,
  formatMeasurement,
} from "./recipe-display.ts";

/**
 * Test suite for recipe display utilities
 */
Deno.test("recipe-display", async (t) => {
  const testIngredient: RecipeIngredient = {
    ingredientId: "test-gin",
    name: "Gin",
    quantity: 2,
    unit: "oz",
    optional: false,
  };

  const testUser: User = {
    id: "test-user",
    email: "test@example.com",
    displayName: "Test User",
    preferences: {
      theme: "system",
      preferredMeasurementUnit: "ml",
    },
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  };

  await t.step(
    "displayIngredientForUser should convert measurements for user with preference",
    () => {
      const result = displayIngredientForUser(testIngredient, testUser);

      assertEquals(result.quantity, 59.1); // 2 oz = 59.1 ml
      assertEquals(result.unit, "ml");
      assertEquals(result.name, "Gin");
      assertEquals(result.optional, false);
      assertEquals(result.originalQuantity, 2);
      assertEquals(result.originalUnit, "oz");
    },
  );

  await t.step(
    "displayIngredientForUser should preserve measurements without user",
    () => {
      const result = displayIngredientForUser(testIngredient, null);

      assertEquals(result.quantity, 2);
      assertEquals(result.unit, "oz");
      assertEquals(result.name, "Gin");
      assertEquals(result.optional, false);
      assertEquals(result.originalQuantity, 2);
      assertEquals(result.originalUnit, "oz");
    },
  );

  await t.step(
    "displayIngredientForUser should preserve measurements for user with same preference",
    () => {
      const ozUser: User = {
        ...testUser,
        preferences: {
          theme: "system",
          preferredMeasurementUnit: "oz",
        },
      };

      const result = displayIngredientForUser(testIngredient, ozUser);

      assertEquals(result.quantity, 2);
      assertEquals(result.unit, "oz");
      assertEquals(result.name, "Gin");
      assertEquals(result.optional, false);
    },
  );

  await t.step(
    "displayIngredientForUser should preserve non-convertible units",
    () => {
      const dashIngredient: RecipeIngredient = {
        ingredientId: "test-bitters",
        name: "Angostura Bitters",
        quantity: 3,
        unit: "dash",
        optional: false,
      };

      const result = displayIngredientForUser(dashIngredient, testUser);

      assertEquals(result.quantity, 3);
      assertEquals(result.unit, "dash");
      assertEquals(result.name, "Angostura Bitters");
    },
  );

  await t.step(
    "displayIngredientForUser should handle optional ingredients and notes",
    () => {
      const optionalIngredient: RecipeIngredient = {
        ingredientId: "test-garnish",
        name: "Orange Peel",
        quantity: 1,
        unit: "piece",
        optional: true,
        notes: "for garnish",
      };

      const result = displayIngredientForUser(optionalIngredient, testUser);

      assertEquals(result.optional, true);
      assertEquals(result.notes, "for garnish");
      assertEquals(result.quantity, 1);
      assertEquals(result.unit, "piece");
    },
  );

  await t.step("formatMeasurement should format quantities correctly", () => {
    // Whole numbers
    assertEquals(formatMeasurement(2, "oz"), "2 oz");
    assertEquals(formatMeasurement(60, "ml"), "60 ml");

    // Decimal numbers
    assertEquals(formatMeasurement(2.5, "oz"), "2.5 oz");
    assertEquals(formatMeasurement(59.1, "ml"), "59.1 ml");

    // Zero
    assertEquals(formatMeasurement(0, "oz"), "0 oz");

    // Very small numbers (should be rounded to 1 decimal)
    assertEquals(formatMeasurement(0.123456, "ml"), "0.1 ml");
  });

  await t.step(
    "displayIngredientsForUser should convert all ingredients",
    () => {
      const ingredients: RecipeIngredient[] = [
        {
          ingredientId: "gin",
          name: "Gin",
          quantity: 2,
          unit: "oz",
          optional: false,
        },
        {
          ingredientId: "vermouth",
          name: "Dry Vermouth",
          quantity: 0.5,
          unit: "oz",
          optional: false,
        },
        {
          ingredientId: "bitters",
          name: "Orange Bitters",
          quantity: 2,
          unit: "dash",
          optional: true,
        },
      ];

      const results = displayIngredientsForUser(ingredients, testUser);

      assertEquals(results.length, 3);

      // First ingredient (convertible)
      assertEquals(results[0].quantity, 59.1); // 2 oz → 59.1 ml
      assertEquals(results[0].unit, "ml");
      assertEquals(results[0].name, "Gin");

      // Second ingredient (convertible)
      assertEquals(results[1].quantity, 14.8); // 0.5 oz → 14.8 ml
      assertEquals(results[1].unit, "ml");
      assertEquals(results[1].name, "Dry Vermouth");

      // Third ingredient (non-convertible)
      assertEquals(results[2].quantity, 2);
      assertEquals(results[2].unit, "dash");
      assertEquals(results[2].name, "Orange Bitters");
      assertEquals(results[2].optional, true);
    },
  );

  await t.step(
    "displayIngredientsForUser should preserve all ingredients without user",
    () => {
      const ingredients: RecipeIngredient[] = [
        {
          ingredientId: "gin",
          name: "Gin",
          quantity: 2,
          unit: "oz",
          optional: false,
        },
        {
          ingredientId: "vermouth",
          name: "Dry Vermouth",
          quantity: 15,
          unit: "ml",
          optional: false,
        },
      ];

      const results = displayIngredientsForUser(ingredients, null);

      assertEquals(results.length, 2);
      assertEquals(results[0].quantity, 2);
      assertEquals(results[0].unit, "oz");
      assertEquals(results[1].quantity, 15);
      assertEquals(results[1].unit, "ml");
    },
  );
});
