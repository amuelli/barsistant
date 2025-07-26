/// <reference lib="deno.unstable" />

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import type {
  IngredientType,
  MeasurementUnit,
} from "../../types/ingredient.ts";
import { GlasswareType } from "../../types/recipe.ts";
import { ingredientModel } from "./ingredient-model.ts";
import {
  createIngredientNameMap,
  createRecipeWithSimpleIngredients,
  findIngredientByName,
  findOrCreateIngredient,
  getRecipesByIngredientName,
  SimpleRecipeIngredient,
  updateRecipeWithSimpleIngredients,
} from "./recipe-helper.ts";
import { recipeModel } from "./recipe-model.ts";

Deno.test("Recipe Helper - JIT Ingredient Creation and Recipe Management", async (t) => {
  // Test data for ingredients that will be created just-in-time
  const testGin: SimpleRecipeIngredient = {
    name: "Test Gin",
    type: "spirit" as IngredientType,
    quantity: 30,
    unit: "ml" as MeasurementUnit,
    description: "A test gin for cocktails",
    abv: 40.0,
    optional: false,
  };

  const testCampari: SimpleRecipeIngredient = {
    name: "Test Campari",
    type: "liqueur" as IngredientType,
    quantity: 30,
    unit: "ml" as MeasurementUnit,
    description: "A test bitter Italian liqueur",
    abv: 24.0,
    optional: false,
  };

  const testSweetVermouth: SimpleRecipeIngredient = {
    name: "Test Sweet Vermouth",
    type: "fortified_wine" as IngredientType,
    quantity: 30,
    unit: "ml" as MeasurementUnit,
    description: "A test sweet vermouth",
    abv: 16.0,
    optional: false,
  };

  const testOrangePeel = {
    name: "Test Orange Peel",
    type: "garnish" as IngredientType,
    quantity: 1,
    unit: "piece" as MeasurementUnit,
    description: "A test orange peel garnish",
    optional: true,
  };

  // Test recipe with JIT ingredients
  const testNegroni = {
    name: "Test Helper Negroni",
    description: "A classic Italian cocktail created via helper",
    createdBy: "test-user",
    visibility: "private" as const,
    ingredients: [testGin, testCampari, testSweetVermouth, testOrangePeel],
    garnish: ["Orange Peel"],
    glassware: "rocks" as GlasswareType,
    preparation: [
      "Add all ingredients to a mixing glass with ice",
      "Stir until well-chilled",
      "Strain into a rocks glass over fresh ice",
      "Garnish with an orange peel",
    ],
    source: {
      name: "Test Helper Source",
      url: "https://example.com/test-helper-negroni",
    },
    tags: ["gin", "classic", "italian", "test-helper"],
  };

  // Store references to created resources
  const createdIngredientIds: string[] = [];
  let createdRecipeId: string | null = null;

  // Test findIngredientByName - when ingredient doesn't exist yet
  await t.step("findIngredientByName - nonexistent ingredient", async () => {
    const result = await findIngredientByName(testGin.name);
    assertEquals(result, null, "Should return null for nonexistent ingredient");
  });

  // Test findOrCreateIngredient
  await t.step("findOrCreateIngredient - create new", async () => {
    const ingredient = await findOrCreateIngredient({
      name: testGin.name,
      type: testGin.type,
      description: testGin.description,
      abv: testGin.abv,
    });

    assertExists(ingredient, "Should create a new ingredient");
    assertExists(ingredient.id, "Created ingredient should have an ID");
    assertEquals(ingredient.name, testGin.name);
    assertEquals(ingredient.type, testGin.type);
    assertEquals(ingredient.description, testGin.description);
    assertEquals(ingredient.abv, testGin.abv);

    createdIngredientIds.push(ingredient.id);
  });

  // Test findIngredientByName - when ingredient exists
  await t.step("findIngredientByName - existing ingredient", async () => {
    const result = await findIngredientByName(testGin.name);

    assertExists(result, "Should find the ingredient we just created");
    assertEquals(result.name, testGin.name);
    assertEquals(result.id, createdIngredientIds[0]);
  });

  // Test findIngredientByName - case insensitivity
  await t.step("findIngredientByName - case insensitive match", async () => {
    const result = await findIngredientByName(testGin.name.toLowerCase());

    assertExists(result, "Should find the ingredient with different case");
    assertEquals(result.name, testGin.name);
    assertEquals(result.id, createdIngredientIds[0]);
  });

  // Test createRecipeWithSimpleIngredients
  await t.step("createRecipeWithSimpleIngredients", async () => {
    const recipe = await createRecipeWithSimpleIngredients(testNegroni);

    assertExists(recipe, "Should create a recipe with JIT ingredients");
    assertExists(recipe.id, "Created recipe should have an ID");
    assertEquals(recipe.name, testNegroni.name);
    assertEquals(recipe.ingredients.length, 4, "Should have 4 ingredients");

    // Keep reference for later tests
    createdRecipeId = recipe.id;

    // Check that all ingredients got proper IDs
    for (const ingredient of recipe.ingredients) {
      assertExists(
        ingredient.ingredientId,
        "Each ingredient should have an ID",
      );
      // Capture ingredient IDs for cleanup if they were created JIT
      if (!createdIngredientIds.includes(ingredient.ingredientId)) {
        createdIngredientIds.push(ingredient.ingredientId);
      }
    }
  });

  // Test updateRecipeWithSimpleIngredients
  await t.step("updateRecipeWithSimpleIngredients", async () => {
    // Update the recipe with a new ingredient and different quantities
    const testLemonTwist: SimpleRecipeIngredient = {
      name: "Test Lemon Twist",
      type: "other" as IngredientType,
      quantity: 1,
      unit: "piece" as MeasurementUnit,
      description: "A test lemon twist garnish",
      optional: true,
    };

    const updatedNegroni = await updateRecipeWithSimpleIngredients(
      createdRecipeId!,
      {
        name: "Updated Test Helper Negroni",
        ingredients: [
          // Modified gin quantity
          {
            ...testGin,
            quantity: 45,
          },
          testCampari,
          testSweetVermouth,
          // Replace orange peel with lemon twist
          testLemonTwist,
        ],
        garnish: ["Lemon Twist"],
      },
    );

    assertExists(updatedNegroni, "Should update the recipe");
    assertEquals(updatedNegroni.name, "Updated Test Helper Negroni");
    assertEquals(
      updatedNegroni.ingredients.length,
      4,
      "Should still have 4 ingredients",
    );
    assertEquals(
      updatedNegroni.garnish[0],
      "Lemon Twist",
      "Garnish should be updated",
    );

    // Find the gin ingredient
    const ginIngredient = updatedNegroni.ingredients.find((i) => {
      return i.ingredientId === createdIngredientIds[0];
    });

    assertExists(ginIngredient, "Should still have the gin ingredient");
    assertEquals(
      ginIngredient!.quantity,
      45,
      "Gin quantity should be updated",
    );

    // Check if lemon twist was added
    const hasLemonTwist = updatedNegroni.ingredients.some(
      (i) => i.name === testLemonTwist.name,
    );
    assertEquals(hasLemonTwist, true, "Recipe should include lemon twist");

    // Make sure orange peel is gone
    const hasOrangePeel = updatedNegroni.ingredients.some(
      (i) => i.name === testOrangePeel.name,
    );
    assertEquals(
      hasOrangePeel,
      false,
      "Recipe should no longer include orange peel",
    );

    // Add new ingredient ID for cleanup
    const lemonTwistIngredient = await findIngredientByName(
      testLemonTwist.name,
    );
    if (
      lemonTwistIngredient &&
      !createdIngredientIds.includes(lemonTwistIngredient.id)
    ) {
      createdIngredientIds.push(lemonTwistIngredient.id);
    }
  });

  // Test updateRecipeWithSimpleIngredients - without ingredients update
  await t.step(
    "updateRecipeWithSimpleIngredients - metadata only",
    async () => {
      const updatedNegroni = await updateRecipeWithSimpleIngredients(
        createdRecipeId!,
        {
          description: "Updated description without changing ingredients",
          tags: ["updated", "test-helper"],
        },
      );

      assertExists(updatedNegroni, "Should update the recipe");
      assertEquals(
        updatedNegroni.description,
        "Updated description without changing ingredients",
      );
      assertEquals(
        updatedNegroni.tags.includes("updated"),
        true,
        "Tags should be updated",
      );
      assertEquals(
        updatedNegroni.ingredients.length,
        4,
        "Ingredients should remain unchanged",
      );
    },
  );

  // Test getRecipesByIngredientName
  await t.step("getRecipesByIngredientName", async () => {
    const recipes = await getRecipesByIngredientName(testGin.name);

    assertExists(recipes, "Should return recipes with the ingredient");
    assertEquals(Array.isArray(recipes), true, "Should return an array");
    assertEquals(
      recipes.length >= 1,
      true,
      "Should find at least our test recipe",
    );

    // Check that our created recipe is in the results
    const hasTestRecipe = recipes.some((r) => r.id === createdRecipeId);
    assertEquals(hasTestRecipe, true, "Results should include our test recipe");
  });

  // Test createIngredientNameMap
  await t.step("createIngredientNameMap", async () => {
    const nameMap = await createIngredientNameMap([
      testGin.name,
      testCampari.name,
      "Nonexistent Ingredient",
    ]);

    assertExists(nameMap, "Should return a map");
    assertEquals(
      nameMap.size,
      2,
      "Map should contain 2 entries (excluding nonexistent)",
    );
    assertEquals(nameMap.has(testGin.name), true, "Map should contain gin");
    assertEquals(
      nameMap.has(testCampari.name),
      true,
      "Map should contain Campari",
    );
    assertEquals(
      nameMap.has("Nonexistent Ingredient"),
      false,
      "Map shouldn't contain nonexistent ingredient",
    );
  });

  // Clean up test data
  await t.step("cleanup", async () => {
    // Delete the recipe
    if (createdRecipeId) {
      const recipe = await recipeModel.getByIdForAdmin(createdRecipeId);
      if (recipe) {
        const deleteResult = await recipeModel.deleteUserRecipe(
          recipe.createdBy,
          createdRecipeId,
        );
        assertEquals(deleteResult, true, "Recipe deletion should succeed");
      }
    }

    // Delete all ingredients we created
    for (const id of createdIngredientIds) {
      await ingredientModel.delete(id);
    }

    // Verify recipe is gone
    if (createdRecipeId) {
      const deletedRecipe = await recipeModel.getByIdForAdmin(createdRecipeId);
      assertEquals(deletedRecipe, null, "Recipe should be deleted");
    }
  });
});
