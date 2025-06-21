import { assertEquals, assertExists, assertRejects } from "@std/assert";
import {
  DatabaseError,
  executeDbOperation,
  getKv,
  isDatabaseHealthy,
  kv,
} from "./db.ts";

Deno.test("Database connection initializes successfully", async () => {
  const kvInstance = await getKv();
  assertExists(kvInstance, "KV instance should be created");
});

Deno.test("Singleton KV instance works", () => {
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
      await executeDbOperation(() => {
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
