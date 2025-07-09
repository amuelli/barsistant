import {
  assertEquals,
  assertNotEquals,
  assertStringIncludes as _assertStringIncludes,
} from "@std/assert";
import {
  createMagicLinkToken,
  generateMagicLinkToken,
  validateMagicLinkToken,
} from "./token.ts";
import { kv } from "../db/db.ts";
import { MagicLinkToken } from "../../types/user.ts";

Deno.test("generateMagicLinkToken", async (t) => {
  await t.step("should generate a 64-character hex token", () => {
    const token = generateMagicLinkToken();
    assertEquals(token.length, 64);
    assertEquals(/^[a-f0-9]+$/.test(token), true);
  });

  await t.step("should generate unique tokens", () => {
    const token1 = generateMagicLinkToken();
    const token2 = generateMagicLinkToken();
    assertNotEquals(token1, token2);
  });
});

Deno.test("createMagicLinkToken", async (t) => {
  const testEmail = "test@example.com";
  const testUserId = "test-user-id";

  await t.step("should create token for new user", async () => {
    const token = await createMagicLinkToken(testEmail);

    assertEquals(token.length, 64);
    assertEquals(/^[a-f0-9]+$/.test(token), true);

    // Verify token exists in database
    const stored = await kv.get<MagicLinkToken>(["auth_tokens", token]);
    assertEquals(stored.value?.email, testEmail);
    assertEquals(stored.value?.userId, undefined);
    assertEquals(stored.value?.used, false);
  });

  await t.step("should create token for existing user", async () => {
    const token = await createMagicLinkToken(testEmail, testUserId);

    // Verify token exists in database
    const stored = await kv.get<MagicLinkToken>(["auth_tokens", token]);
    assertEquals(stored.value?.email, testEmail);
    assertEquals(stored.value?.userId, testUserId);
    assertEquals(stored.value?.used, false);
  });

  await t.step("should set custom expiration", async () => {
    const token = await createMagicLinkToken(testEmail, undefined, 5);

    const stored = await kv.get<MagicLinkToken>(["auth_tokens", token]);
    const expiresAt = new Date(stored.value?.expires || "");
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Should expire within 5 minutes (with some tolerance)
    assertEquals(expiresAt.getTime() > now.getTime(), true);
    assertEquals(
      expiresAt.getTime() <= fiveMinutesFromNow.getTime() + 1000,
      true,
    );
  });

  // Cleanup
  await t.step("cleanup", async () => {
    const iterator = kv.list({ prefix: ["auth_tokens"] });
    for await (const entry of iterator) {
      await kv.delete(entry.key);
    }
  });
});

Deno.test("validateMagicLinkToken", async (t) => {
  const testEmail = "test@example.com";
  const testUserId = "test-user-id";

  await t.step("should validate valid token", async () => {
    const token = await createMagicLinkToken(testEmail, testUserId);

    const validatedToken = await validateMagicLinkToken(token);
    assertEquals(validatedToken?.email, testEmail);
    assertEquals(validatedToken?.userId, testUserId);
    assertEquals(validatedToken?.used, true);
  });

  await t.step("should reject invalid token", async () => {
    const invalidToken = "invalid-token";

    const validatedToken = await validateMagicLinkToken(invalidToken);
    assertEquals(validatedToken, null);
  });

  await t.step("should reject used token", async () => {
    const token = await createMagicLinkToken(testEmail, testUserId);

    // Use token once
    await validateMagicLinkToken(token);

    // Try to use again
    const validatedToken = await validateMagicLinkToken(token);
    assertEquals(validatedToken, null);
  });

  await t.step("should reject expired token", async () => {
    // Create token that expires in 1ms
    const token = await createMagicLinkToken(testEmail, testUserId, 0.001 / 60);

    // Wait for token to expire
    await new Promise((resolve) => setTimeout(resolve, 10));

    const validatedToken = await validateMagicLinkToken(token);
    assertEquals(validatedToken, null);
  });

  // Cleanup
  await t.step("cleanup", async () => {
    const iterator = kv.list({ prefix: ["auth_tokens"] });
    for await (const entry of iterator) {
      await kv.delete(entry.key);
    }
  });
});
