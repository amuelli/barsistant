/// <reference lib="deno.unstable" />

import type { FreshContext } from "fresh";
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createUserSession } from "🛠️/auth/session.ts";
import { createMagicLinkToken } from "🛠️/auth/token.ts";
import { createUser, deleteUser } from "🛠️/auth/user.ts";
import { recipeModel } from "🛠️/db/recipe-model.ts";
import { State } from "🛠️/define.ts";
import { createMockRequest } from "🛠️/test-helpers.ts";
import { Recipe } from "../../../../types/recipe.ts";
import { handler } from "./visibility.ts";

Deno.test("Recipe Visibility API", async (t) => {
  let testUser: { id: string; email: string };
  let otherUser: { id: string; email: string };
  let testRecipe: Recipe;
  let sessionToken: string;
  let otherSessionToken: string;

  await t.step("setup - create test users and recipe", async () => {
    // Create test users
    testUser = await createUser("test-visibility@example.com");
    otherUser = await createUser("other-visibility@example.com");

    // Create sessions for users
    const token = await createMagicLinkToken(testUser.email);
    const session = await createUserSession(testUser.id, token);
    sessionToken = session.id;

    const otherToken = await createMagicLinkToken(otherUser.email);
    const otherSession = await createUserSession(otherUser.id, otherToken);
    otherSessionToken = otherSession.id;

    // Create a test recipe
    testRecipe = await recipeModel.create({
      name: "Test Recipe for Visibility",
      description: "Testing visibility toggle",
      ingredients: [
        {
          ingredientId: "test-ingredient",
          name: "Test Ingredient",
          quantity: 50,
          unit: "ml",
          optional: false,
        },
      ],
      garnish: [],
      glassware: "rocks",
      preparation: ["Mix", "Serve"],
      source: { name: "Test" },
      tags: ["test"],
      visibility: "public",
      createdBy: testUser.id,
    });

    // Other user copies the recipe to their collection (simulate saving)
    await recipeModel.copyRecipe(testRecipe.id, otherUser.id, "private");
  });

  await t.step("should require authentication", async () => {
    const req = createMockRequest(
      "POST",
      `/api/recipes/${testRecipe.id}/visibility`,
      { action: "toggle" },
    );

    const response = await handler.POST({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext<State>);

    assertEquals(response.status, 401);
  });

  await t.step("should handle empty JSON body gracefully", async () => {
    const req = createMockRequest(
      "POST",
      `/api/recipes/${testRecipe.id}/visibility`,
      null, // Empty body that will cause JSON parse error
      {
        Cookie: `session=${sessionToken}`,
      },
    );

    const response = await handler.POST({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext<State>);

    assertEquals(response.status, 500); // JSON parse error should result in 500
  });

  await t.step("should reject invalid actions", async () => {
    const req = createMockRequest(
      "POST",
      `/api/recipes/${testRecipe.id}/visibility`,
      { action: "invalid" },
      {
        Cookie: `session=${sessionToken}`,
      },
    );

    const response = await handler.POST({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext<State>);

    assertEquals(response.status, 400);
  });

  await t.step(
    "should prevent non-owners from changing visibility",
    async () => {
      const req = createMockRequest(
        "POST",
        `/api/recipes/${testRecipe.id}/visibility`,
        { action: "toggle" },
        {
          Cookie: `session=${otherSessionToken}`,
        },
      );

      const response = await handler.POST({
        req,
        params: { id: testRecipe.id },
      } as unknown as FreshContext<State>);

      assertEquals(response.status, 403);
    },
  );

  await t.step("should toggle from public to private", async () => {
    // Verify other user has a copy of the recipe
    const otherUserRecipes = await recipeModel.listUserRecipes(otherUser.id);
    const hasCopyBefore = otherUserRecipes.some(r => r.originalRecipeId === testRecipe.id);
    assertEquals(hasCopyBefore, true);

    const req = createMockRequest(
      "POST",
      `/api/recipes/${testRecipe.id}/visibility`,
      { action: "toggle" },
      {
        Cookie: `session=${sessionToken}`,
      },
    );

    const response = await handler.POST({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext<State>);

    assertEquals(response.status, 200);
    const result = await response.json();

    assertEquals(result.success, true);
    assertEquals(result.visibility, "private");
    assertEquals(result.changed, true);
    assertExists(result.message);

    // Verify recipe was updated
    const updatedRecipe = await recipeModel.getByIdForAdmin(testRecipe.id);
    assertEquals(updatedRecipe?.visibility, "private");

    // Verify other user's copy was removed when recipe became private
    const otherUserRecipesAfter = await recipeModel.listUserRecipes(otherUser.id);
    const hasCopyAfter = otherUserRecipesAfter.some(r => r.originalRecipeId === testRecipe.id);
    assertEquals(hasCopyAfter, false);
  });

  await t.step("should toggle from private to public", async () => {
    const req = createMockRequest(
      "POST",
      `/api/recipes/${testRecipe.id}/visibility`,
      { action: "toggle" },
      {
        Cookie: `session=${sessionToken}`,
      },
    );

    const response = await handler.POST({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext<State>);

    assertEquals(response.status, 200);
    const result = await response.json();

    assertEquals(result.success, true);
    assertEquals(result.visibility, "public");
    assertEquals(result.changed, true);

    // Verify recipe was updated
    const updatedRecipe = await recipeModel.getByIdForAdmin(testRecipe.id);
    assertEquals(updatedRecipe?.visibility, "public");
  });

  await t.step("should handle setPublic action", async () => {
    // First make it private
    await recipeModel.updateUserRecipe(testRecipe.createdBy, testRecipe.id, {
      visibility: "private",
    });

    const req = createMockRequest(
      "POST",
      `/api/recipes/${testRecipe.id}/visibility`,
      { action: "setPublic" },
      {
        Cookie: `session=${sessionToken}`,
      },
    );

    const response = await handler.POST({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext<State>);

    assertEquals(response.status, 200);
    const result = await response.json();

    assertEquals(result.visibility, "public");
    assertEquals(result.changed, true);
  });

  await t.step("should handle setPrivate action", async () => {
    const req = createMockRequest(
      "POST",
      `/api/recipes/${testRecipe.id}/visibility`,
      { action: "setPrivate" },
      {
        Cookie: `session=${sessionToken}`,
      },
    );

    const response = await handler.POST({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext<State>);

    assertEquals(response.status, 200);
    const result = await response.json();

    assertEquals(result.visibility, "private");
    assertEquals(result.changed, true);
  });

  await t.step("should handle idempotent operations", async () => {
    // Try to set private again
    const req = createMockRequest(
      "POST",
      `/api/recipes/${testRecipe.id}/visibility`,
      { action: "setPrivate" },
      {
        Cookie: `session=${sessionToken}`,
      },
    );

    const response = await handler.POST({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext<State>);

    assertEquals(response.status, 200);
    const result = await response.json();

    assertEquals(result.visibility, "private");
    assertEquals(result.changed, false);
    assertEquals(result.message, "Recipe is already private");
  });

  await t.step("should handle non-existent recipe", async () => {
    const req = createMockRequest(
      "POST",
      "/api/recipes/non-existent-id/visibility",
      { action: "toggle" },
      {
        Cookie: `session=${sessionToken}`,
      },
    );

    const response = await handler.POST({
      req,
      params: { id: "non-existent-id" },
    } as unknown as FreshContext<State>);

    assertEquals(response.status, 404);
  });

  await t.step("cleanup", async () => {
    // Delete test recipe
    await recipeModel.deleteUserRecipe(testRecipe.createdBy, testRecipe.id);

    // Delete test users
    await deleteUser(testUser.id);
    await deleteUser(otherUser.id);
  });
});
