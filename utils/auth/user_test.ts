import { assertEquals, assertNotEquals } from "@std/assert";
import { User } from "../../types/user.ts";
import { kv } from "../db/db.ts";
import {
  createDefaultUserPreferences,
  createUser,
  findUserByEmail,
  findUserById,
  generateUserId,
  updateUserLastLogin,
  updateUserPreferences,
} from "./user.ts";

Deno.test("generateUserId", async (t) => {
  await t.step("should generate valid UUID", () => {
    const userId = generateUserId();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    assertEquals(uuidRegex.test(userId), true);
  });

  await t.step("should generate unique IDs", () => {
    const userId1 = generateUserId();
    const userId2 = generateUserId();
    assertNotEquals(userId1, userId2);
  });
});

Deno.test("createDefaultUserPreferences", async (t) => {
  await t.step("should create valid default preferences", () => {
    const preferences = createDefaultUserPreferences();

    assertEquals(preferences.theme, "system");
    assertEquals(preferences.preferredMeasurementUnit, "imperial");
  });
});

Deno.test("createUser", async (t) => {
  const testEmail = "test@example.com";
  const testDisplayName = "Test User";

  await t.step("should create user with display name", async () => {
    const user = await createUser(testEmail, testDisplayName);

    assertEquals(user.email, testEmail);
    assertEquals(user.displayName, testDisplayName);
    assertEquals(typeof user.id, "string");
    assertEquals(user.preferences.theme, "system");
    assertEquals(typeof user.createdAt, "string");
    assertEquals(typeof user.updatedAt, "string");
  });

  await t.step("should create user without display name", async () => {
    const email = "test2@example.com";
    const user = await createUser(email);

    assertEquals(user.email, email);
    assertEquals(user.displayName, "test2"); // Should extract from email
  });

  await t.step("should store user in database", async () => {
    const email = "test3@example.com";
    const user = await createUser(email);

    // Check user record
    const storedUser = await kv.get<User>(["users", user.id]);
    assertEquals(storedUser.value?.email, email);

    // Check email lookup
    const emailLookup = await kv.get(["user_emails", email]);
    assertEquals(emailLookup.value, user.id);
  });

  // Cleanup
  await t.step("cleanup", async () => {
    const usersIterator = kv.list({ prefix: ["users"] });
    for await (const entry of usersIterator) {
      await kv.delete(entry.key);
    }

    const emailsIterator = kv.list({ prefix: ["user_emails"] });
    for await (const entry of emailsIterator) {
      await kv.delete(entry.key);
    }
  });
});

Deno.test("findUserByEmail", async (t) => {
  const testEmail = "test@example.com";
  let userId: string;

  await t.step("setup", async () => {
    const user = await createUser(testEmail);
    userId = user.id;
  });

  await t.step("should find existing user", async () => {
    const user = await findUserByEmail(testEmail);
    assertEquals(user?.email, testEmail);
    assertEquals(user?.id, userId);
  });

  await t.step("should return null for non-existent user", async () => {
    const user = await findUserByEmail("nonexistent@example.com");
    assertEquals(user, null);
  });

  // Cleanup
  await t.step("cleanup", async () => {
    const usersIterator = kv.list({ prefix: ["users"] });
    for await (const entry of usersIterator) {
      await kv.delete(entry.key);
    }

    const emailsIterator = kv.list({ prefix: ["user_emails"] });
    for await (const entry of emailsIterator) {
      await kv.delete(entry.key);
    }
  });
});

Deno.test("findUserById", async (t) => {
  const testEmail = "test@example.com";
  let userId: string;

  await t.step("setup", async () => {
    const user = await createUser(testEmail);
    userId = user.id;
  });

  await t.step("should find existing user", async () => {
    const user = await findUserById(userId);
    assertEquals(user?.email, testEmail);
    assertEquals(user?.id, userId);
  });

  await t.step("should return null for non-existent user", async () => {
    const user = await findUserById("non-existent-id");
    assertEquals(user, null);
  });

  // Cleanup
  await t.step("cleanup", async () => {
    const usersIterator = kv.list({ prefix: ["users"] });
    for await (const entry of usersIterator) {
      await kv.delete(entry.key);
    }

    const emailsIterator = kv.list({ prefix: ["user_emails"] });
    for await (const entry of emailsIterator) {
      await kv.delete(entry.key);
    }
  });
});

Deno.test("updateUserLastLogin", async (t) => {
  const testEmail = "test@example.com";
  let userId: string;

  await t.step("setup", async () => {
    const user = await createUser(testEmail);
    userId = user.id;
  });

  await t.step("should update last login timestamp", async () => {
    const beforeUpdate = new Date();
    await updateUserLastLogin(userId);

    const user = await findUserById(userId);
    assertEquals(typeof user?.lastLoginAt, "string");

    const lastLogin = new Date(user!.lastLoginAt!);
    assertEquals(lastLogin.getTime() >= beforeUpdate.getTime(), true);
  });

  await t.step("should throw error for non-existent user", async () => {
    try {
      await updateUserLastLogin("non-existent-id");
      assertEquals(true, false, "Should have thrown error");
    } catch (error) {
      assertEquals((error as Error).message, "User not found");
    }
  });

  // Cleanup
  await t.step("cleanup", async () => {
    const usersIterator = kv.list({ prefix: ["users"] });
    for await (const entry of usersIterator) {
      await kv.delete(entry.key);
    }

    const emailsIterator = kv.list({ prefix: ["user_emails"] });
    for await (const entry of emailsIterator) {
      await kv.delete(entry.key);
    }
  });
});

Deno.test("updateUserPreferences", async (t) => {
  const testEmail = "test@example.com";
  let userId: string;

  await t.step("setup", async () => {
    const user = await createUser(testEmail);
    userId = user.id;
  });

  await t.step("should update user preferences", async () => {
    const newPreferences = {
      theme: "dark" as const,
    };

    const updatedUser = await updateUserPreferences(userId, newPreferences);

    assertEquals(updatedUser.preferences.theme, "dark");
  });

  await t.step("should throw error for non-existent user", async () => {
    try {
      await updateUserPreferences("non-existent-id", { theme: "dark" });
      assertEquals(true, false, "Should have thrown error");
    } catch (error) {
      assertEquals((error as Error).message, "User not found");
    }
  });

  // Cleanup
  await t.step("cleanup", async () => {
    const usersIterator = kv.list({ prefix: ["users"] });
    for await (const entry of usersIterator) {
      await kv.delete(entry.key);
    }

    const emailsIterator = kv.list({ prefix: ["user_emails"] });
    for await (const entry of emailsIterator) {
      await kv.delete(entry.key);
    }
  });
});
