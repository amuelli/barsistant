/// <reference lib="deno.unstable" />

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createMockRequest } from "../../../../utils/test-helpers.ts";
import type { FreshContext } from "fresh";
import { handler } from "./visibility.ts";
import { recipeModel } from "../../../../utils/db/recipe-model.ts";
import { createUser, deleteUser } from "../../../../utils/auth/user.ts";
import { userCollectionModel } from "../../../../utils/db/user-collection-model.ts";
import { createMagicLinkToken } from "../../../../utils/auth/token.ts";
import { createUserSession } from "../../../../utils/auth/session.ts";
import { Recipe } from "../../../../types/recipe.ts";

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

    // Have other user add the recipe to their collection
    await userCollectionModel.addToCollection(
      otherUser.id,
      testRecipe.id,
      "saved",
      "Test",
    );
  });

  await t.step("should require authentication", async () => {
    const req = createMockRequest(
      "POST",
      `/api/recipes/${testRecipe.id}/visibility`,
      { action: "toggle" },
    );

    const response = await handler({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext);

    assertEquals(response.status, 401);
  });

  await t.step("should reject non-POST methods", async () => {
    const req = createMockRequest(
      "GET",
      `/api/recipes/${testRecipe.id}/visibility`,
      null,
      {
        Cookie: `session=${sessionToken}`,
      },
    );

    const response = await handler({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext);

    assertEquals(response.status, 405);
    assertEquals(response.headers.get("Allow"), "POST");
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

    const response = await handler({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext);

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

      const response = await handler({
        req,
        params: { id: testRecipe.id },
      } as unknown as FreshContext);

      assertEquals(response.status, 403);
    },
  );

  await t.step("should toggle from public to private", async () => {
    // Verify recipe is in other user's collection
    const inCollectionBefore = await userCollectionModel.isInUserCollection(
      otherUser.id,
      testRecipe.id,
    );
    assertEquals(inCollectionBefore, true);

    const req = createMockRequest(
      "POST",
      `/api/recipes/${testRecipe.id}/visibility`,
      { action: "toggle" },
      {
        Cookie: `session=${sessionToken}`,
      },
    );

    const response = await handler({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext);

    assertEquals(response.status, 200);
    const result = await response.json();

    assertEquals(result.success, true);
    assertEquals(result.visibility, "private");
    assertEquals(result.changed, true);
    assertExists(result.message);

    // Verify recipe was updated
    const updatedRecipe = await recipeModel.getById(testRecipe.id);
    assertEquals(updatedRecipe?.visibility, "private");

    // Verify recipe was removed from other user's collection
    const inCollectionAfter = await userCollectionModel.isInUserCollection(
      otherUser.id,
      testRecipe.id,
    );
    assertEquals(inCollectionAfter, false);
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

    const response = await handler({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext);

    assertEquals(response.status, 200);
    const result = await response.json();

    assertEquals(result.success, true);
    assertEquals(result.visibility, "public");
    assertEquals(result.changed, true);

    // Verify recipe was updated
    const updatedRecipe = await recipeModel.getById(testRecipe.id);
    assertEquals(updatedRecipe?.visibility, "public");
  });

  await t.step("should handle setPublic action", async () => {
    // First make it private
    await recipeModel.update(testRecipe.id, { visibility: "private" });

    const req = createMockRequest(
      "POST",
      `/api/recipes/${testRecipe.id}/visibility`,
      { action: "setPublic" },
      {
        Cookie: `session=${sessionToken}`,
      },
    );

    const response = await handler({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext);

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

    const response = await handler({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext);

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

    const response = await handler({
      req,
      params: { id: testRecipe.id },
    } as unknown as FreshContext);

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

    const response = await handler({
      req,
      params: { id: "non-existent-id" },
    } as unknown as FreshContext);

    assertEquals(response.status, 404);
  });

  await t.step("cleanup", async () => {
    // Delete test recipe
    await recipeModel.delete(testRecipe.id);

    // Delete test users
    await deleteUser(testUser.id);
    await deleteUser(otherUser.id);
  });
});
