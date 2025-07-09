/**
 * Security utilities for authentication
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate display name
 */
export function isValidDisplayName(displayName: string): boolean {
  // Allow letters, numbers, spaces, and common punctuation
  const nameRegex = /^[a-zA-Z0-9\s\-_\.,']+$/;
  return nameRegex.test(displayName) && displayName.length >= 1 &&
    displayName.length <= 100;
}

/**
 * Sanitize display name input
 */
export function sanitizeDisplayName(displayName: string): string {
  return displayName.trim().replace(/\s+/g, " ");
}

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Validate request origin for CSRF protection
 */
export function validateOrigin(
  request: Request,
  allowedOrigins: string[] = [],
): boolean {
  const origin = request.headers.get("Origin");
  const referer = request.headers.get("Referer");

  if (!origin && !referer) {
    // Allow requests without origin/referer (e.g., direct API calls)
    return true;
  }

  const requestOrigin = origin || (referer ? new URL(referer).origin : null);

  if (!requestOrigin) {
    return false;
  }

  // Check against allowed origins
  if (allowedOrigins.length > 0) {
    return allowedOrigins.includes(requestOrigin);
  }

  // If no allowed origins specified, check against request host
  const requestUrl = new URL(request.url);
  return requestOrigin === requestUrl.origin;
}

/**
 * Extract IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfIP = request.headers.get("cf-connecting-ip");

  if (cfIP) return cfIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

/**
 * Create secure response headers
 */
export function createSecureHeaders(
  additionalHeaders: Record<string, string> = {},
): Headers {
  const headers = new Headers(additionalHeaders);

  // Security headers
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Fresh needs unsafe-inline/eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  );

  return headers;
}

/**
 * Validate session token format
 */
export function isValidSessionToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

/**
 * Validate magic link token format
 */
export function isValidMagicLinkToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

/**
 * Hash data using SHA-256
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validate user agent to detect potential bot requests
 */
export function isLikelyBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http-client/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown> = {},
): void {
  console.log(`[SECURITY] ${event}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}
