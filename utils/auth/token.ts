import { kv } from "../db/db.ts";
import { MagicLinkToken } from "../../types/user.ts";

/**
 * Generate a secure random token for magic link authentication
 */
export function generateMagicLinkToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Create and store a magic link token in the database
 */
export async function createMagicLinkToken(
  email: string,
  userId?: string,
  expirationMinutes: number = 15,
): Promise<string> {
  const token = generateMagicLinkToken();
  const expires = new Date(Date.now() + expirationMinutes * 60 * 1000);

  const magicLinkToken: MagicLinkToken = {
    token,
    email,
    userId,
    expires: expires.toISOString(),
    used: false,
  };

  await kv.set(["auth_tokens", token], magicLinkToken, {
    expireIn: expirationMinutes * 60 * 1000,
  });

  return token;
}

/**
 * Validate and consume a magic link token
 */
export async function validateMagicLinkToken(
  token: string,
): Promise<MagicLinkToken | null> {
  const result = await kv.get<MagicLinkToken>(["auth_tokens", token]);

  if (!result.value) {
    return null;
  }

  const magicLinkToken = result.value;

  // Check if token is expired
  if (new Date() > new Date(magicLinkToken.expires)) {
    await kv.delete(["auth_tokens", token]);
    return null;
  }

  // Check if token has already been used
  if (magicLinkToken.used) {
    return null;
  }

  // Mark token as used
  magicLinkToken.used = true;
  await kv.set(["auth_tokens", token], magicLinkToken);

  return magicLinkToken;
}

/**
 * Clean up expired magic link tokens
 */
export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date();
  const iterator = kv.list<MagicLinkToken>({ prefix: ["auth_tokens"] });

  for await (const entry of iterator) {
    const token = entry.value;
    if (new Date(token.expires) < now) {
      await kv.delete(entry.key);
    }
  }
}
