import { MagicLinkToken } from "../../types/user.ts";
import { type AuthCodeEmailKey, type AuthCodeKey, kv } from "../db/db.ts";

/**
 * Generate a secure 8-digit verification code (format: 1234-5678)
 */
export function generateVerificationCode(): string {
  const part1 = Math.floor(1000 + Math.random() * 9000).toString();
  const part2 = Math.floor(1000 + Math.random() * 9000).toString();
  return `${part1}-${part2}`;
}

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
): Promise<{ token: string; code: string }> {
  const token = generateMagicLinkToken();
  const verificationCode = generateVerificationCode();
  const expires = new Date(Date.now() + expirationMinutes * 60 * 1000);

  const magicLinkToken: MagicLinkToken = {
    token,
    email,
    verificationCode,
    userId,
    expires: expires.toISOString(),
    used: false,
  };

  // Store with both token and code as keys for quick lookup
  const authCodeKey: AuthCodeKey = ["auth_codes", verificationCode];
  const authCodeEmailKey: AuthCodeEmailKey = ["auth_code_email", email];

  // Atomic transaction to ensure consistency
  const tx = kv.atomic();

  // Store by code for direct code lookup
  tx.set(authCodeKey, magicLinkToken, {
    expireIn: expirationMinutes * 60 * 1000,
  });

  // Store email -> codes mapping for rate limiting
  const existingCodes = await kv.get<string[]>(authCodeEmailKey);
  const codes = existingCodes.value || [];
  codes.push(verificationCode);
  tx.set(authCodeEmailKey, codes, {
    expireIn: expirationMinutes * 60 * 1000,
  });

  await tx.commit();

  return { token, code: verificationCode };
}

/**
 * Validate and consume a magic link token by verification code
 */
export async function validateVerificationCode(
  code: string,
): Promise<MagicLinkToken | null> {
  // Normalize code (remove spaces and dashes)
  const normalizedCode = code.replace(/[\s-]/g, "");

  // Reconstruct the formatted code
  if (normalizedCode.length === 8) {
    const formattedCode = `${normalizedCode.slice(0, 4)}-${
      normalizedCode.slice(4)
    }`;
    const authCodeKey: AuthCodeKey = ["auth_codes", formattedCode];
    const result = await kv.get<MagicLinkToken>(authCodeKey);

    if (!result.value) {
      return null;
    }

    const magicLinkToken = result.value;

    // Check if token is expired
    if (new Date() > new Date(magicLinkToken.expires)) {
      await kv.delete(authCodeKey);
      return null;
    }

    // Check if token has already been used
    if (magicLinkToken.used) {
      return null;
    }

    // Mark token as used
    magicLinkToken.used = true;
    await kv.set(authCodeKey, magicLinkToken);

    return magicLinkToken;
  }

  return null;
}

/**
 * Validate and consume a magic link token
 */
export function validateMagicLinkToken(
  tokenOrCode: string,
): Promise<MagicLinkToken | null> {
  // Check if it's a verification code (8 digits with optional dash)
  const codePattern = /^(\d{4})-?(\d{4})$/;
  if (codePattern.test(tokenOrCode)) {
    return validateVerificationCode(tokenOrCode);
  }

  // Otherwise, treat as a token - but we no longer store by token
  // For backward compatibility during migration
  return Promise.resolve(null);
}

/**
 * Clean up expired magic link tokens
 */
export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date();

  // Clean up codes
  const codeIterator = kv.list<MagicLinkToken>({ prefix: ["auth_codes"] });
  for await (const entry of codeIterator) {
    const token = entry.value;
    if (new Date(token.expires) < now) {
      await kv.delete(entry.key);
    }
  }

  // Clean up email mappings
  const emailIterator = kv.list<string[]>({ prefix: ["auth_code_email"] });
  for await (const _entry of emailIterator) {
    // These have TTL set, so they'll expire automatically
    // But we can clean them up if needed
  }
}
