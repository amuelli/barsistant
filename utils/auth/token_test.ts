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
    const { token: _token, code } = await createMagicLinkToken(testEmail);

    assertEquals(_token.length, 64);
    assertEquals(/^[a-f0-9]+$/.test(_token), true);
    assertEquals(code.length, 9); // Format: 1234-5678
    assertEquals(/^\d{4}-\d{4}$/.test(code), true);

    // Verify token exists in database by code
    const stored = await kv.get<MagicLinkToken>(["auth_codes", code]);
    assertEquals(stored.value?.email, testEmail);
    assertEquals(stored.value?.userId, undefined);
    assertEquals(stored.value?.used, false);
  });

  await t.step("should create token for existing user", async () => {
    const { token: _token, code } = await createMagicLinkToken(
      testEmail,
      testUserId,
    );

    // Verify token exists in database by code
    const stored = await kv.get<MagicLinkToken>(["auth_codes", code]);
    assertEquals(stored.value?.email, testEmail);
    assertEquals(stored.value?.userId, testUserId);
    assertEquals(stored.value?.used, false);
  });

  await t.step("should set custom expiration", async () => {
    const { token: _token, code } = await createMagicLinkToken(
      testEmail,
      undefined,
      5,
    );

    const stored = await kv.get<MagicLinkToken>(["auth_codes", code]);
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
    const codeIterator = kv.list({ prefix: ["auth_codes"] });
    for await (const entry of codeIterator) {
      await kv.delete(entry.key);
    }
    const emailIterator = kv.list({ prefix: ["auth_code_email"] });
    for await (const entry of emailIterator) {
      await kv.delete(entry.key);
    }
  });
});

Deno.test("validateMagicLinkToken", async (t) => {
  const testEmail = "test@example.com";
  const testUserId = "test-user-id";

  await t.step("should validate valid code", async () => {
    const { token: _token, code } = await createMagicLinkToken(
      testEmail,
      testUserId,
    );

    const validatedToken = await validateMagicLinkToken(code);
    assertEquals(validatedToken?.email, testEmail);
    assertEquals(validatedToken?.userId, testUserId);
    assertEquals(validatedToken?.used, true);
  });

  await t.step("should reject invalid token", async () => {
    const invalidToken = "invalid-token";

    const validatedToken = await validateMagicLinkToken(invalidToken);
    assertEquals(validatedToken, null);
  });

  await t.step("should reject used code", async () => {
    const { token: _token, code } = await createMagicLinkToken(
      testEmail,
      testUserId,
    );

    // Use code once
    await validateMagicLinkToken(code);

    // Try to use again
    const validatedToken = await validateMagicLinkToken(code);
    assertEquals(validatedToken, null);
  });

  await t.step("should reject expired code", async () => {
    // Create token that expires in 1ms
    const { token: _token, code } = await createMagicLinkToken(
      testEmail,
      testUserId,
      0.001 / 60,
    );

    // Wait for token to expire
    await new Promise((resolve) => setTimeout(resolve, 10));

    const validatedToken = await validateMagicLinkToken(code);
    assertEquals(validatedToken, null);
  });

  // Cleanup
  await t.step("cleanup", async () => {
    const codeIterator = kv.list({ prefix: ["auth_codes"] });
    for await (const entry of codeIterator) {
      await kv.delete(entry.key);
    }
    const emailIterator = kv.list({ prefix: ["auth_code_email"] });
    for await (const entry of emailIterator) {
      await kv.delete(entry.key);
    }
  });
});
