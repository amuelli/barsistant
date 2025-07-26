import { kv, type RateLimitKey } from "../db/db.ts";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: Request) => string;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

/**
 * Default key generator uses IP address
 */
function defaultKeyGenerator(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip;
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private prefix: string;
  private windowMs: number;
  public maxRequests: number;
  private keyGenerator: (request: Request) => string;

  constructor(prefix: string, options: RateLimitOptions) {
    this.prefix = prefix;
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.keyGenerator = options.keyGenerator || defaultKeyGenerator;
  }

  private getRateLimitKey(identifier: string): RateLimitKey {
    return ["rate_limit", this.prefix, identifier];
  }

  async checkLimit(request: Request): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const identifier = this.keyGenerator(request);
    const key = this.getRateLimitKey(identifier);
    const now = Date.now();
    const _windowStart = now - this.windowMs;

    try {
      const result = await kv.get<RateLimitInfo>(key);
      let rateLimitInfo = result.value;

      if (!rateLimitInfo || rateLimitInfo.resetTime < now) {
        // Create new window
        rateLimitInfo = {
          count: 1,
          resetTime: now + this.windowMs,
        };
        await kv.set(key, rateLimitInfo, { expireIn: this.windowMs });

        return {
          allowed: true,
          remaining: this.maxRequests - 1,
          resetTime: rateLimitInfo.resetTime,
        };
      }

      if (rateLimitInfo.count >= this.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: rateLimitInfo.resetTime,
        };
      }

      // Increment count
      rateLimitInfo.count++;
      await kv.set(key, rateLimitInfo, { expireIn: this.windowMs });

      return {
        allowed: true,
        remaining: this.maxRequests - rateLimitInfo.count,
        resetTime: rateLimitInfo.resetTime,
      };
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Fail open - allow request if rate limit check fails
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: now + this.windowMs,
      };
    }
  }

  async resetLimit(request: Request): Promise<void> {
    const identifier = this.keyGenerator(request);
    const key = this.getRateLimitKey(identifier);
    await kv.delete(key);
  }
}

/**
 * Email-based rate limiter for auth requests
 */
export function createEmailRateLimiter(
  windowMs: number = 15 * 60 * 1000,
  maxRequests: number = 5,
) {
  return new RateLimiter("email", {
    windowMs,
    maxRequests,
    keyGenerator: (request: Request) => {
      // For email rate limiting, we'll extract email from request body
      // This requires the caller to pass the email in the request
      const url = new URL(request.url);
      const email = url.searchParams.get("email");
      return email || defaultKeyGenerator(request);
    },
  });
}

/**
 * IP-based rate limiter for general auth requests
 */
export function createIPRateLimiter(
  windowMs: number = 15 * 60 * 1000,
  maxRequests: number = 20,
) {
  return new RateLimiter("ip", {
    windowMs,
    maxRequests,
    keyGenerator: defaultKeyGenerator,
  });
}

/**
 * Middleware to apply rate limiting
 */
export function rateLimit(limiter: RateLimiter) {
  return async (request: Request): Promise<Response | null> => {
    const result = await limiter.checkLimit(request);

    if (!result.allowed) {
      const resetTimeSeconds = Math.ceil(
        (result.resetTime - Date.now()) / 1000,
      );

      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message:
            `Too many requests. Try again in ${resetTimeSeconds} seconds.`,
          resetTime: result.resetTime,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limiter.maxRequests.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.resetTime.toString(),
            "Retry-After": resetTimeSeconds.toString(),
          },
        },
      );
    }

    return null; // Allow request to proceed
  };
}
