import { assertEquals, assertExists, assertRejects } from "@std/assert";
import {
  DatabaseError,
  executeDbOperation,
  getKv,
  isDatabaseHealthy,
  kv,
  recipes,
} from "./db.ts";

Deno.test("Database connection initializes successfully", async () => {
  const kvInstance = await getKv();
  assertExists(kvInstance, "KV instance should be created");
});

Deno.test("Singleton KV instance works", async () => {
  assertExists(kv, "Exported KV instance should be available");
});

Deno.test("Execute DB operation handles successful operations", async () => {
  const testKey = ["test", crypto.randomUUID()];
  const testValue = { test: "value" };

  const result = await executeDbOperation(async () => {
    await kv.set(testKey, testValue);
    const { value } = await kv.get(testKey);
    return value;
  }, "Test operation failed");

  assertEquals(result, testValue, "Should return the test value");

  // Clean up
  await kv.delete(testKey);
});

Deno.test("Execute DB operation handles errors", async () => {
  await assertRejects(
    async () => {
      await executeDbOperation(async () => {
        throw new Error("Simulated error");
      }, "Custom error message");
    },
    DatabaseError,
    "Custom error message",
    "Should throw DatabaseError with custom message",
  );
});

Deno.test("Database health check returns true when database is accessible", async () => {
  const health = await isDatabaseHealthy();
  assertEquals(health, true, "Database should be healthy");
});

Deno.test("Recipe helpers - set and get", async () => {
  const recipeId = `test-recipe-${crypto.randomUUID()}`;
  const testRecipe = {
    name: "Test Recipe",
    ingredients: ["test ingredient 1", "test ingredient 2"],
  };

  await recipes.set(recipeId, testRecipe);
  const retrieved = await recipes.get(recipeId);

  assertEquals(
    retrieved,
    testRecipe,
    "Should retrieve the same recipe that was set",
  );

  // Clean up
  await recipes.delete(recipeId);
});

Deno.test("Recipe helpers - list", async () => {
  const recipeId1 = `test-recipe-${crypto.randomUUID()}`;
  const recipeId2 = `test-recipe-${crypto.randomUUID()}`;

  const testRecipe1 = { name: "Test Recipe 1" };
  const testRecipe2 = { name: "Test Recipe 2" };

  await recipes.set(recipeId1, testRecipe1);
  await recipes.set(recipeId2, testRecipe2);

  const results: Array<unknown> = [];
  for await (const entry of recipes.list()) {
    results.push(entry.value);
  }

  // Check if our test recipes are in the results
  const containsRecipe1 = results.some((r) =>
    typeof r === "object" && r !== null && "name" in r &&
    r.name === "Test Recipe 1"
  );
  const containsRecipe2 = results.some((r) =>
    typeof r === "object" && r !== null && "name" in r &&
    r.name === "Test Recipe 2"
  );

  assertEquals(containsRecipe1, true, "Results should contain test recipe 1");
  assertEquals(containsRecipe2, true, "Results should contain test recipe 2");

  // Clean up
  await recipes.delete(recipeId1);
  await recipes.delete(recipeId2);
});

// This test is commented out as it would actually close the database connection
// which might affect other tests. Uncomment when running this test in isolation.
/*
Deno.test("Close database works correctly", async () => {
  await closeDatabase();
  const kvInstanceBefore = await getKv(); // This will create a new connection
  assertExists(kvInstanceBefore);
});
*/
