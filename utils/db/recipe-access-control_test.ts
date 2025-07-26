/// <reference lib="deno.unstable" />

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { MeasurementUnit } from "../../types/ingredient.ts";
import { GlasswareType, Recipe } from "../../types/recipe.ts";
import { recipeModel } from "./recipe-model.ts";

Deno.test("Recipe Access Control - Private Recipe Security", async (t) => {
  const testUser1 = "test-user-access-1";
  const testUser2 = "test-user-access-2";

  // Test data for a private recipe
  const privateRecipeData = {
    name: "Test Private Recipe",
    description: "A private recipe for testing access control",
    createdBy: testUser1,
    visibility: "private" as const,
    ingredients: [
      {
        ingredientId: "test-ingredient-1",
        name: "Test Ingredient",
        quantity: 50,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
    ],
    garnish: ["Test Garnish"],
    glassware: "rocks" as GlasswareType,
    preparation: ["Test preparation"],
    source: { name: "Test Source" },
    tags: ["test", "private"],
  };

  // Test data for a public recipe
  const publicRecipeData = {
    ...privateRecipeData,
    name: "Test Public Recipe",
    description: "A public recipe for testing access control",
    visibility: "public" as const,
    tags: ["test", "public"],
  };

  let privateRecipe: Recipe;
  let publicRecipe: Recipe;

  await t.step("create test recipes", async () => {
    // Create private recipe
    privateRecipe = await recipeModel.create(privateRecipeData);
    assertExists(privateRecipe.id);
    assertEquals(privateRecipe.visibility, "private");
    assertEquals(privateRecipe.createdBy, testUser1);

    // Create public recipe
    publicRecipe = await recipeModel.create(publicRecipeData);
    assertExists(publicRecipe.id);
    assertEquals(publicRecipe.visibility, "public");
    assertEquals(publicRecipe.createdBy, testUser1);
  });

  await t.step(
    "canUserAccessRecipe - owner can access private recipe",
    async () => {
      const canAccess = await recipeModel.canUserAccessRecipe(
        privateRecipe.id,
        testUser1,
      );
      assertEquals(canAccess, true);
    },
  );

  await t.step(
    "canUserAccessRecipe - other user cannot access private recipe",
    async () => {
      const canAccess = await recipeModel.canUserAccessRecipe(
        privateRecipe.id,
        testUser2,
      );
      assertEquals(canAccess, false);
    },
  );

  await t.step(
    "canUserAccessRecipe - unauthenticated user cannot access private recipe",
    async () => {
      const canAccess = await recipeModel.canUserAccessRecipe(
        privateRecipe.id,
        null,
      );
      assertEquals(canAccess, false);
    },
  );

  await t.step(
    "canUserAccessRecipe - anyone can access public recipe",
    async () => {
      // Owner can access
      const ownerCanAccess = await recipeModel.canUserAccessRecipe(
        publicRecipe.id,
        testUser1,
      );
      assertEquals(ownerCanAccess, true);

      // Other user can access
      const otherCanAccess = await recipeModel.canUserAccessRecipe(
        publicRecipe.id,
        testUser2,
      );
      assertEquals(otherCanAccess, true);

      // Unauthenticated can access
      const unauthCanAccess = await recipeModel.canUserAccessRecipe(
        publicRecipe.id,
        null,
      );
      assertEquals(unauthCanAccess, true);
    },
  );

  await t.step(
    "canUserAccessRecipe - non-existent recipe returns false",
    async () => {
      const canAccess = await recipeModel.canUserAccessRecipe(
        "non-existent-id",
        testUser1,
      );
      assertEquals(canAccess, false);
    },
  );

  await t.step("cleanup", async () => {
    await recipeModel.deleteUserRecipe(testUser1, privateRecipe.id);
    await recipeModel.deleteUserRecipe(testUser1, publicRecipe.id);
  });
});

Deno.test("Recipe Search Security - Private Recipe Filtering", async (t) => {
  const testUser1 = "test-user-search-1";
  const testUser2 = "test-user-search-2";

  const searchTerm = "search-test-recipe";

  // Create test recipes
  const privateRecipe1 = await recipeModel.create({
    name: `Private ${searchTerm} by User1`,
    description: "Private recipe",
    createdBy: testUser1,
    visibility: "private" as const,
    ingredients: [
      {
        ingredientId: "test-ing-1",
        name: "Test Ingredient",
        quantity: 50,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
    ],
    garnish: [],
    glassware: "rocks" as GlasswareType,
    preparation: ["Test"],
    source: { name: "Test" },
    tags: ["search-test"],
  });

  const privateRecipe2 = await recipeModel.create({
    name: `Private ${searchTerm} by User2`,
    description: "Another private recipe",
    createdBy: testUser2,
    visibility: "private" as const,
    ingredients: [
      {
        ingredientId: "test-ing-2",
        name: "Test Ingredient",
        quantity: 50,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
    ],
    garnish: [],
    glassware: "rocks" as GlasswareType,
    preparation: ["Test"],
    source: { name: "Test" },
    tags: ["search-test"],
  });

  const publicRecipe = await recipeModel.create({
    name: `Public ${searchTerm}`,
    description: "Public recipe",
    createdBy: testUser1,
    visibility: "public" as const,
    ingredients: [
      {
        ingredientId: "test-ing-3",
        name: "Test Ingredient",
        quantity: 50,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
    ],
    garnish: [],
    glassware: "rocks" as GlasswareType,
    preparation: ["Test"],
    source: { name: "Test" },
    tags: ["search-test"],
  });

  await t.step(
    "searchPublicRecipes - only returns public recipes",
    async () => {
      const results = await recipeModel.searchPublicRecipes({
        query: searchTerm,
      });

      // Should find only the public recipe
      const matchingResults = results.filter((r) =>
        r.name.includes(searchTerm)
      );
      assertEquals(matchingResults.length, 1);
      assertEquals(matchingResults[0].id, publicRecipe.id);
      assertEquals(matchingResults[0].visibility, "public");
    },
  );

  await t.step(
    "searchUserAccessibleRecipes - user1 sees own private + public",
    async () => {
      const results = await recipeModel.searchUserAccessibleRecipes(testUser1, {
        query: searchTerm,
      });

      const matchingResults = results.filter((r) =>
        r.name.includes(searchTerm)
      );
      assertEquals(matchingResults.length, 2); // Own private + public

      // Should include user1's private recipe and the public recipe
      const recipeIds = matchingResults.map((r) => r.id);
      assertEquals(recipeIds.includes(privateRecipe1.id), true);
      assertEquals(recipeIds.includes(publicRecipe.id), true);
      assertEquals(recipeIds.includes(privateRecipe2.id), false); // Should NOT include user2's private
    },
  );

  await t.step(
    "searchUserAccessibleRecipes - user2 sees own private + public",
    async () => {
      const results = await recipeModel.searchUserAccessibleRecipes(testUser2, {
        query: searchTerm,
      });

      const matchingResults = results.filter((r) =>
        r.name.includes(searchTerm)
      );
      assertEquals(matchingResults.length, 2); // Own private + public

      // Should include user2's private recipe and the public recipe
      const recipeIds = matchingResults.map((r) => r.id);
      assertEquals(recipeIds.includes(privateRecipe2.id), true);
      assertEquals(recipeIds.includes(publicRecipe.id), true);
      assertEquals(recipeIds.includes(privateRecipe1.id), false); // Should NOT include user1's private
    },
  );

  await t.step(
    "deprecated search method - returns all recipes (security issue)",
    async () => {
      const results = await recipeModel.search({ query: searchTerm });

      const matchingResults = results.filter((r) =>
        r.name.includes(searchTerm)
      );
      assertEquals(matchingResults.length >= 3, true); // Should find all 3 (this is the security issue)
    },
  );

  await t.step("cleanup", async () => {
    await recipeModel.deleteUserRecipe(testUser1, privateRecipe1.id);
    await recipeModel.deleteUserRecipe(testUser2, privateRecipe2.id);
    await recipeModel.deleteUserRecipe(testUser1, publicRecipe.id);
  });
});

Deno.test("API Access Control - Recipe Endpoint Security", async (t) => {
  const testUser1 = "test-user-api-1";
  const testUser2 = "test-user-api-2";

  // Create a private recipe
  const privateRecipe = await recipeModel.create({
    name: "Private API Test Recipe",
    description: "Testing API access control",
    createdBy: testUser1,
    visibility: "private" as const,
    ingredients: [
      {
        ingredientId: "api-test-ing",
        name: "Test Ingredient",
        quantity: 50,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
    ],
    garnish: [],
    glassware: "rocks" as GlasswareType,
    preparation: ["Test"],
    source: { name: "Test" },
    tags: ["api-test"],
  });

  // Create a public recipe
  const publicRecipe = await recipeModel.create({
    name: "Public API Test Recipe",
    description: "Testing API access control",
    createdBy: testUser1,
    visibility: "public" as const,
    ingredients: [
      {
        ingredientId: "api-test-ing-2",
        name: "Test Ingredient",
        quantity: 50,
        unit: "ml" as MeasurementUnit,
        optional: false,
      },
    ],
    garnish: [],
    glassware: "rocks" as GlasswareType,
    preparation: ["Test"],
    source: { name: "Test" },
    tags: ["api-test"],
  });

  await t.step(
    "verify recipes were created with correct visibility",
    () => {
      assertEquals(privateRecipe.visibility, "private");
      assertEquals(publicRecipe.visibility, "public");
      assertEquals(privateRecipe.createdBy, testUser1);
      assertEquals(publicRecipe.createdBy, testUser1);
    },
  );

  await t.step("simulate API access scenarios", async () => {
    // These tests verify the logic that would be used in the API endpoint
    // The actual HTTP requests would be tested in integration tests

    // Owner should be able to access their private recipe
    const ownerCanAccessPrivate = await recipeModel.canUserAccessRecipe(
      privateRecipe.id,
      testUser1,
    );
    assertEquals(ownerCanAccessPrivate, true);

    // Other user should NOT be able to access private recipe
    const otherCannotAccessPrivate = await recipeModel.canUserAccessRecipe(
      privateRecipe.id,
      testUser2,
    );
    assertEquals(otherCannotAccessPrivate, false);

    // Unauthenticated user should NOT be able to access private recipe
    const unauthCannotAccessPrivate = await recipeModel.canUserAccessRecipe(
      privateRecipe.id,
      null,
    );
    assertEquals(unauthCannotAccessPrivate, false);

    // Anyone should be able to access public recipe
    const ownerCanAccessPublic = await recipeModel.canUserAccessRecipe(
      publicRecipe.id,
      testUser1,
    );
    assertEquals(ownerCanAccessPublic, true);

    const otherCanAccessPublic = await recipeModel.canUserAccessRecipe(
      publicRecipe.id,
      testUser2,
    );
    assertEquals(otherCanAccessPublic, true);

    const unauthCanAccessPublic = await recipeModel.canUserAccessRecipe(
      publicRecipe.id,
      null,
    );
    assertEquals(unauthCanAccessPublic, true);
  });

  await t.step("cleanup", async () => {
    await recipeModel.deleteUserRecipe(testUser1, privateRecipe.id);
    await recipeModel.deleteUserRecipe(testUser1, publicRecipe.id);
  });
});
