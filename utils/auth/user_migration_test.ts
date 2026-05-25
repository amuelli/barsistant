import { assertEquals } from "@std/assert";
import { User } from "../../types/user.ts";
import { kv } from "../db/db.ts";
import {
  findUserByEmail,
  findUserById,
  generateUserId,
  migrateLegacyPreferences,
} from "./user.ts";

/**
 * Legacy user preference type for testing migration
 */
type LegacyUserPreferences = {
  theme: "light" | "dark" | "system";
  preferredMeasurementUnit: "metric" | "imperial" | "both" | "oz" | "ml";
};

/**
 * Legacy user type for testing migration
 */
type LegacyUser = Omit<User, "preferences"> & {
  preferences: LegacyUserPreferences;
};

/**
 * Test suite for user preference migration functionality
 */
Deno.test("migrateLegacyPreferences", async (t) => {
  await t.step("should migrate 'imperial' to 'oz'", () => {
    const legacyPrefs = {
      theme: "system" as const,
      preferredMeasurementUnit: "imperial" as const,
    };

    const migrated = migrateLegacyPreferences(legacyPrefs);
    assertEquals(migrated.theme, "system");
    assertEquals(migrated.preferredMeasurementUnit, "oz");
  });

  await t.step("should migrate 'metric' to 'ml'", () => {
    const legacyPrefs = {
      theme: "dark" as const,
      preferredMeasurementUnit: "metric" as const,
    };

    const migrated = migrateLegacyPreferences(legacyPrefs);
    assertEquals(migrated.theme, "dark");
    assertEquals(migrated.preferredMeasurementUnit, "ml");
  });

  await t.step("should migrate 'both' to 'oz' (default)", () => {
    const legacyPrefs = {
      theme: "light" as const,
      preferredMeasurementUnit: "both" as const,
    };

    const migrated = migrateLegacyPreferences(legacyPrefs);
    assertEquals(migrated.theme, "light");
    assertEquals(migrated.preferredMeasurementUnit, "oz");
  });

  await t.step("should preserve 'oz' unchanged", () => {
    const legacyPrefs = {
      theme: "system" as const,
      preferredMeasurementUnit: "oz" as const,
    };

    const migrated = migrateLegacyPreferences(legacyPrefs);
    assertEquals(migrated.theme, "system");
    assertEquals(migrated.preferredMeasurementUnit, "oz");
  });

  await t.step("should preserve 'ml' unchanged", () => {
    const legacyPrefs = {
      theme: "system" as const,
      preferredMeasurementUnit: "ml" as const,
    };

    const migrated = migrateLegacyPreferences(legacyPrefs);
    assertEquals(migrated.theme, "system");
    assertEquals(migrated.preferredMeasurementUnit, "ml");
  });

  await t.step("should default unknown values to 'oz'", () => {
    const legacyPrefs = {
      theme: "system" as const,
      preferredMeasurementUnit:
        "unknown" as LegacyUserPreferences["preferredMeasurementUnit"],
    };

    const migrated = migrateLegacyPreferences(legacyPrefs);
    assertEquals(migrated.theme, "system");
    assertEquals(migrated.preferredMeasurementUnit, "oz");
  });
});

Deno.test("findUserById with migration", async (t) => {
  let userId: string;

  await t.step("setup - create user with legacy preferences", async () => {
    // Create a user manually with legacy preferences
    const user: LegacyUser = {
      id: generateUserId(),
      email: "legacy@example.com",
      displayName: "Legacy User",
      preferences: {
        theme: "system",
        preferredMeasurementUnit: "imperial", // Legacy format
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    userId = user.id;
    await kv.set(["users", user.id], user);
    await kv.set(["user_emails", user.email], user.id);
  });

  await t.step(
    "should automatically migrate legacy preferences on findUserById",
    async () => {
      const user = await findUserById(userId);

      assertEquals(user?.email, "legacy@example.com");
      assertEquals(user?.preferences.theme, "system");
      assertEquals(user?.preferences.preferredMeasurementUnit, "oz"); // Should be migrated
    },
  );

  await t.step("should persist migrated preferences", async () => {
    // Fetch directly from database to verify migration was saved
    const directResult = await kv.get<User>(["users", userId]);
    const user = directResult.value;

    assertEquals(user?.preferences.preferredMeasurementUnit, "oz");
  });

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

Deno.test("findUserByEmail with migration", async (t) => {
  let testEmail: string;

  await t.step(
    "setup - create user with legacy 'metric' preference",
    async () => {
      testEmail = "metric-user@example.com";

      const user: LegacyUser = {
        id: generateUserId(),
        email: testEmail,
        displayName: "Metric User",
        preferences: {
          theme: "dark",
          preferredMeasurementUnit: "metric", // Legacy format
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await kv.set(["users", user.id], user);
      await kv.set(["user_emails", user.email], user.id);
    },
  );

  await t.step(
    "should automatically migrate to 'ml' via findUserByEmail",
    async () => {
      const user = await findUserByEmail(testEmail);

      assertEquals(user?.email, testEmail);
      assertEquals(user?.preferences.theme, "dark");
      assertEquals(user?.preferences.preferredMeasurementUnit, "ml"); // Should be migrated from metric
    },
  );

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
