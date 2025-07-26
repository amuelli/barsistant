import { User } from "../../types/user.ts";
import { getUserSession } from "./session.ts";
import { findUserById } from "./user.ts";

/**
 * Extract session ID from request cookies
 */
function getSessionIdFromRequest(request: Request): string | null {
  const cookies = request.headers.get("cookie") || "";
  const sessionMatch = cookies.match(/session=([^;]+)/);
  const sessionId = sessionMatch ? sessionMatch[1] : null;

  return sessionId;
}

/**
 * Check if running in production environment
 */
function isProductionEnvironment(): boolean {
  return !!(Deno.env.get("DENO_DEPLOYMENT_ID") ||
    Deno.env.get("NODE_ENV") === "production");
}

/**
 * Authentication result with detailed status information
 */
type AuthResult =
  | { success: true; user: User; sessionId: string }
  | {
    success: false;
    reason: "no_session" | "invalid_session" | "user_not_found" | "error";
  };

/**
 * Shared helper to get both user and session data efficiently with detailed error information
 */
async function getUserAndSessionFromRequest(
  request: Request,
): Promise<AuthResult> {
  const sessionId = getSessionIdFromRequest(request);

  if (!sessionId) {
    return { success: false, reason: "no_session" };
  }

  try {
    const session = await getUserSession(sessionId);

    if (!session) {
      return { success: false, reason: "invalid_session" };
    }

    // Get user data
    const user = await findUserById(session.userId);

    if (!user) {
      return { success: false, reason: "user_not_found" };
    }

    return { success: true, user, sessionId };
  } catch (error) {
    console.error("Error getting user from session:", error);
    return { success: false, reason: "error" };
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: Request,
): Promise<{ user: User; sessionId: string } | Response> {
  const result = await getUserAndSessionFromRequest(request);

  if (!result.success) {
    const errorMessage = result.reason === "no_session"
      ? "Authentication required"
      : result.reason === "invalid_session"
      ? "Invalid session"
      : result.reason === "user_not_found"
      ? "User not found"
      : "Authentication error";

    const statusCode = result.reason === "error" ? 500 : 401;

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { user: result.user, sessionId: result.sessionId };
}

/**
 * Middleware to optionally get user (doesn't require auth)
 */
export async function optionalAuth(
  request: Request,
): Promise<{ user: User | null; sessionId: string | null }> {
  const result = await getUserAndSessionFromRequest(request);

  if (!result.success) {
    return { user: null, sessionId: null };
  }

  return { user: result.user, sessionId: result.sessionId };
}

/**
 * Create a response with session cookie
 */
export function createSessionResponse(
  sessionId: string,
  body?: BodyInit | null,
  responseInit?: ResponseInit,
): Response {
  const headers = new Headers(responseInit?.headers);

  // Only use Secure flag in production (HTTPS)
  const secureFlag = isProductionEnvironment() ? "; Secure" : "";

  headers.set(
    "Set-Cookie",
    `session=${sessionId}; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${
      30 * 24 * 60 * 60
    }; Path=/`,
  );

  return new Response(body, {
    ...responseInit,
    headers,
  });
}

/**
 * Create a response that clears the session cookie
 */
export function createLogoutResponse(
  body?: BodyInit | null,
  responseInit?: ResponseInit,
): Response {
  const headers = new Headers(responseInit?.headers);

  // Only use Secure flag in production (HTTPS)
  const secureFlag = isProductionEnvironment() ? "; Secure" : "";

  headers.set(
    "Set-Cookie",
    `session=; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=0; Path=/`,
  );

  return new Response(body, {
    ...responseInit,
    headers,
  });
}
