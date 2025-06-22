/// <reference lib="deno.unstable" />

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { MeasurementUnit } from "../../types/ingredient.ts";
import { GlasswareType, Recipe } from "../../types/recipe.ts";
import { recipeModel } from "./recipe-model.ts";

Deno.test("Recipe Model - CRUD Operations", async (t) => {
  // Test data for first recipe - Old Fashioned
  const testOldFashioned = {
    name: "Test Old Fashioned",
    description: "A test recipe for an Old Fashioned cocktail",
    strength: 8,
    sweetness: 6,
    ingredients: [
      {
        ingredientId: "bourbon123",
        name: "Bourbon",
        quantity: 60,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
      {
        ingredientId: "simple-syrup123",
        name: "Simple Syrup",
        quantity: 10,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
      {
        ingredientId: "bitters123",
        name: "Aromatic Bitters",
        quantity: 3,
        unit: "dash" as MeasurementUnit,
        optional: false,
      },
    ],
    garnish: ["Orange Peel"],
    glassware: "old-fashioned" as GlasswareType,
    preparation: [
      "Add all ingredients to an old-fashioned glass with ice",
      "Stir until chilled",
      "Garnish with an orange peel",
    ],
    source: {
      name: "Test Source",
      url: "https://example.com/test-recipe",
    },
    tags: ["whiskey", "classic", "stirred", "test"],
  };

  // Test data for second recipe - Mojito
  const testMojito = {
    name: "Test Mojito",
    description: "A refreshing rum cocktail with mint and lime",
    strength: 5,
    sweetness: 7,
    ingredients: [
      {
        ingredientId: "white-rum123",
        name: "White Rum",
        quantity: 50,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
      {
        ingredientId: "lime123",
        name: "Lime",
        quantity: 1,
        unit: "piece" as MeasurementUnit,
        optional: false,
      },
      {
        ingredientId: "mint123",
        name: "Mint",
        quantity: 8,
        unit: "leaf" as MeasurementUnit,
        optional: false,
      },
      {
        ingredientId: "simple-syrup123",
        name: "Simple Syrup",
        quantity: 15,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
      {
        ingredientId: "soda123",
        name: "Soda Water",
        quantity: 60,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
    ],
    garnish: ["Mint Sprig", "Lime Wedge"],
    glassware: "highball" as GlasswareType,
    preparation: [
      "Muddle mint leaves with simple syrup and lime juice",
      "Add rum and ice, shake briefly",
      "Strain into a highball glass with fresh ice",
      "Top with soda water",
      "Garnish with mint sprig and lime wedge",
    ],
    source: {
      name: "Test Source",
      url: "https://example.com/test-mojito",
    },
    tags: ["rum", "refreshing", "summer", "shaken", "test"],
  };

  // Test data for third recipe - Negroni
  const testNegroni = {
    name: "Test Negroni",
    description:
      "A classic Italian cocktail with equal parts gin, vermouth, and Campari",
    strength: 9,
    sweetness: 4,
    ingredients: [
      {
        ingredientId: "gin123",
        name: "Gin",
        quantity: 30,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
      {
        ingredientId: "sweet-vermouth123",
        name: "Sweet Vermouth",
        quantity: 30,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
      {
        ingredientId: "campari123",
        name: "Campari",
        quantity: 30,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
    ],
    garnish: ["Orange Peel"],
    glassware: "rocks" as GlasswareType,
    preparation: [
      "Add all ingredients to a mixing glass with ice",
      "Stir until well-chilled",
      "Strain into a rocks glass over fresh ice",
      "Garnish with an orange peel",
    ],
    source: {
      name: "Test Source",
      url: "https://example.com/test-negroni",
    },
    tags: ["gin", "classic", "italian", "stirred", "aperitif", "test"],
  };

  // Store created recipes references
  const createdRecipes: Recipe[] = [];

  // Test creating recipes
  await t.step("create multiple recipes", async () => {
    // Create Old Fashioned
    const oldFashioned = await recipeModel.create(testOldFashioned);

    assertExists(oldFashioned.id, "Recipe should have an ID");
    assertEquals(oldFashioned.name, testOldFashioned.name);
    assertEquals(oldFashioned.ingredients.length, 3);
    assertEquals(oldFashioned.ingredients[0].quantity, 60);
    assertEquals(oldFashioned.ingredients[0].unit, "ml");
    assertExists(oldFashioned.createdAt);
    assertExists(oldFashioned.updatedAt);

    createdRecipes.push(oldFashioned);

    // Create Mojito
    const mojito = await recipeModel.create(testMojito);

    assertExists(mojito.id, "Recipe should have an ID");
    assertEquals(mojito.name, testMojito.name);
    assertEquals(mojito.ingredients.length, 5);
    assertEquals(mojito.strength, 5);
    assertEquals(mojito.sweetness, 7);

    createdRecipes.push(mojito);

    // Create Negroni
    const negroni = await recipeModel.create(testNegroni);

    assertExists(negroni.id, "Recipe should have an ID");
    assertEquals(negroni.name, testNegroni.name);
    assertEquals(negroni.ingredients.length, 3);
    assertEquals(negroni.strength, 9);
    assertEquals(negroni.sweetness, 4);

    createdRecipes.push(negroni);
  });

  // Test retrieving a recipe
  await t.step("get recipe by id", async () => {
    const recipe = await recipeModel.getById(createdRecipes[0].id);

    assertExists(recipe);
    assertEquals(recipe!.id, createdRecipes[0].id);
    assertEquals(recipe!.name, testOldFashioned.name);
    assertEquals(recipe!.ingredients.length, 3);
    assertEquals(recipe!.ingredients[0].quantity, 60);
  });

  // Test updating a recipe
  await t.step("update recipe", async () => {
    const updatedRecipe = await recipeModel.update(createdRecipes[0].id, {
      name: "Updated Test Old Fashioned",
      strength: 9,
      ingredients: [
        // Update the bourbon quantity
        {
          ingredientId: "bourbon123",
          name: "Bourbon",
          quantity: 75, // Increased from 60ml to 75ml
          unit: "ml" as MeasurementUnit,
          optional: false,
        },
        // Keep the simple syrup the same
        {
          ingredientId: "simple-syrup123",
          name: "Simple Syrup",
          quantity: 10,
          unit: "ml" as MeasurementUnit,
          optional: false,
        },
        // Keep the bitters the same
        {
          ingredientId: "bitters123",
          name: "Aromatic Bitters",
          quantity: 3,
          unit: "dash" as MeasurementUnit,
          optional: false,
        },
      ],
    });

    assertEquals(updatedRecipe.id, createdRecipes[0].id);
    assertEquals(updatedRecipe.name, "Updated Test Old Fashioned");
    assertEquals(updatedRecipe.strength, 9);
    assertEquals(updatedRecipe.ingredients.length, 3);
    // Check that the amount was updated
    assertEquals(updatedRecipe.ingredients[0].quantity, 75);
  });

  // Test listing recipes
  await t.step("list all recipes", async () => {
    const recipes = await recipeModel.listAll(10);

    assertExists(recipes);
    assertEquals(Array.isArray(recipes), true);
    // Should find at least our three test recipes
    assertEquals(recipes.length >= 3, true);
  });

  // Test searching recipes by tag
  await t.step("search recipes by tag", async () => {
    // Search for classic cocktails
    const classicRecipes = await recipeModel.getByTag("classic");
    assertExists(classicRecipes);
    assertEquals(Array.isArray(classicRecipes), true);
    assertEquals(classicRecipes.length >= 2, true); // Should find Old Fashioned and Negroni

    // Search for rum cocktails
    const rumRecipes = await recipeModel.getByTag("rum");
    assertExists(rumRecipes);
    assertEquals(Array.isArray(rumRecipes), true);
    assertEquals(rumRecipes.length >= 1, true); // Should find Mojito
    assertEquals(rumRecipes[0].name.includes("Mojito"), true);
  });

  // Test searching recipes by ingredient
  await t.step("search recipes by ingredient", async () => {
    // Search for recipes with bourbon
    const bourbonRecipes = await recipeModel.getByIngredient("bourbon123");
    assertExists(bourbonRecipes);
    assertEquals(Array.isArray(bourbonRecipes), true);
    assertEquals(bourbonRecipes.length >= 1, true); // Should find Old Fashioned
    assertEquals(bourbonRecipes[0].name.includes("Old Fashioned"), true);

    // Search for recipes with simple syrup (should find both Old Fashioned and Mojito)
    const syrupRecipes = await recipeModel.getByIngredient("simple-syrup123");
    assertExists(syrupRecipes);
    assertEquals(Array.isArray(syrupRecipes), true);
    assertEquals(syrupRecipes.length >= 2, true); // Should find Old Fashioned and Mojito

    // Verify that one of the returned recipes is the Mojito
    const hasMojito = syrupRecipes.some((recipe) =>
      recipe.name.includes("Mojito")
    );
    assertEquals(hasMojito, true);
  });

  // Test advanced search - by strength
  await t.step("search by strength range", async () => {
    // Find strong cocktails
    const strongCocktails = await recipeModel.search({
      strengthMin: 8,
      strengthMax: 10,
    });

    assertExists(strongCocktails);
    assertEquals(Array.isArray(strongCocktails), true);
    // Should find Old Fashioned and Negroni
    assertEquals(strongCocktails.length >= 2, true);

    // Verify that we have Negroni in the results
    const hasNegroni = strongCocktails.some((recipe) =>
      recipe.name.includes("Negroni")
    );
    assertEquals(hasNegroni, true);
  });

  // Test advanced search - by sweetness
  await t.step("search by sweetness range", async () => {
    // Find sweeter cocktails
    const sweetCocktails = await recipeModel.search({
      sweetnessMin: 6,
      sweetnessMax: 10,
    });

    assertExists(sweetCocktails);
    assertEquals(Array.isArray(sweetCocktails), true);
    // Should find Old Fashioned and Mojito
    assertEquals(sweetCocktails.length >= 2, true);

    // Find drier cocktails
    const dryCocktails = await recipeModel.search({
      sweetnessMin: 1,
      sweetnessMax: 5,
    });

    assertExists(dryCocktails);
    // Should find Negroni
    const hasNegroni = dryCocktails.some((recipe) =>
      recipe.name.includes("Negroni")
    );
    assertEquals(hasNegroni, true);
  });

  // Test advanced search - by query text
  await t.step("search by text query", async () => {
    // Search for Italian cocktails
    const italianCocktails = await recipeModel.search({
      query: "italian",
    });

    assertExists(italianCocktails);
    assertEquals(Array.isArray(italianCocktails), true);
    // Should find Negroni
    assertEquals(italianCocktails.length >= 1, true);
    assertEquals(italianCocktails[0].name.includes("Negroni"), true);
  });

  // Test advanced search - by multiple ingredients
  await t.step("search by multiple ingredients - any mode", async () => {
    // Find cocktails with either gin OR white rum
    const recipes = await recipeModel.search({
      ingredients: ["gin123", "white-rum123"],
      ingredientMode: "any",
    });

    assertExists(recipes);
    assertEquals(Array.isArray(recipes), true);
    // Should find Negroni and Mojito
    assertEquals(recipes.length >= 2, true);
  });

  // Test advanced search - by multiple ingredients with all mode
  await t.step("search by multiple ingredients - all mode", async () => {
    // Find cocktails with BOTH simple syrup AND bitters
    const recipes = await recipeModel.search({
      ingredients: ["simple-syrup123", "bitters123"],
      ingredientMode: "all",
    });

    assertExists(recipes);
    assertEquals(Array.isArray(recipes), true);
    // Should find only Old Fashioned
    assertEquals(recipes.length >= 1, true);
    assertEquals(recipes[0].name.includes("Old Fashioned"), true);

    // Verify that Mojito is not in the results (has syrup but no bitters)
    const hasMojito = recipes.some((recipe) => recipe.name.includes("Mojito"));
    assertEquals(hasMojito, false);
  });

  // Test compound search with multiple criteria
  await t.step("compound search with multiple criteria", async () => {
    // Find strong, classic cocktails
    const recipes = await recipeModel.search({
      tags: ["classic"],
      strengthMin: 8,
      strengthMax: 10,
    });

    assertExists(recipes);
    assertEquals(recipes.length >= 2, true);

    // Find refreshing summer cocktails with rum
    const summerRecipes = await recipeModel.search({
      tags: ["refreshing", "summer"],
      ingredients: ["white-rum123"],
      ingredientMode: "all",
    });

    assertExists(summerRecipes);
    assertEquals(summerRecipes.length >= 1, true);
    assertEquals(summerRecipes[0].name.includes("Mojito"), true);
  });

  // Clean up - test deleting a recipe
  await t.step("delete recipes", async () => {
    // Delete all created recipes
    for (const recipe of createdRecipes) {
      const result = await recipeModel.delete(recipe.id);
      assertEquals(result, true);

      const deletedRecipe = await recipeModel.getById(recipe.id);
      assertEquals(deletedRecipe, null);
    }
  });
});

Deno.test("Recipe Model - Pagination", async (t) => {
  // Count all existing recipes
  const all = await recipeModel.listAll();
  const existingCount = all.length;

  // Create 35 recipes to ensure we have more than one page (using default limit=30)
  const recipesToCreate = 35;
  const createdIds: string[] = [];
  for (let i = 0; i < recipesToCreate; i++) {
    const recipe = await recipeModel.create({
      name: `Paginated Recipe ${i}`,
      description: `Description ${i}`,
      strength: 5,
      sweetness: 5,
      ingredients: [
        {
          ingredientId: `ingredient${i}`,
          name: `Ingredient ${i}`,
          quantity: 10,
          unit: "ml",
          optional: false,
        },
      ],
      garnish: [],
      glassware: "rocks",
      preparation: ["Mix ingredients"],
      source: { name: "Pagination Test" },
      tags: ["pagination-test"],
    });
    createdIds.push(recipe.id);
  }

  const expectedTotal = existingCount + recipesToCreate;

  await t.step(
    "pagination returns all recipes and page two is correct",
    async () => {
      // Page 1
      const { items: page1, cursor } = await recipeModel.listPage({
        limit: 30,
      });
      assertEquals(page1.length, Math.min(30, expectedTotal));
      assertExists(cursor);
      // Page 2
      const { items: page2, cursor: cursor2 } = await recipeModel.listPage({
        limit: 30,
        cursor,
      });
      // Should be the next chunk, not overlapping
      const page1Ids = new Set(page1.map((r) => r.id));
      const overlap = page2.some((r) => page1Ids.has(r.id));
      assertEquals(overlap, false);
      // The total so far should not exceed expectedTotal
      assertEquals(page1.length + page2.length <= expectedTotal, true);
      // If there are more than 30+30 recipes, cursor2 should exist
      if (expectedTotal > 60) {
        assertExists(cursor2);
      }
    },
  );

  // Clean up
  for (const id of createdIds) {
    await recipeModel.delete(id);
  }
});
