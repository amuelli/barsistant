import { getUserSession, updateSessionActivity } from "./session.ts";
import { findUserById } from "./user.ts";
import { User } from "../../types/user.ts";

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionId?: string;
}

/**
 * Extract session ID from request cookies
 */
export function getSessionIdFromRequest(request: Request): string | null {
  const cookies = request.headers.get("cookie") || "";
  const sessionMatch = cookies.match(/session=([^;]+)/);
  return sessionMatch ? sessionMatch[1] : null;
}

/**
 * Get user from session cookie
 */
export async function getUserFromSession(
  request: Request,
): Promise<User | null> {
  const sessionId = getSessionIdFromRequest(request);

  if (!sessionId) {
    return null;
  }

  try {
    const session = await getUserSession(sessionId);

    if (!session) {
      return null;
    }

    // Update session activity
    await updateSessionActivity(sessionId);

    // Get user data
    const user = await findUserById(session.userId);

    return user;
  } catch (error) {
    console.error("Error getting user from session:", error);
    return null;
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: Request,
): Promise<{ user: User; sessionId: string } | Response> {
  const sessionId = getSessionIdFromRequest(request);

  if (!sessionId) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const session = await getUserSession(sessionId);

    if (!session) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update session activity
    await updateSessionActivity(sessionId);

    // Get user data
    const user = await findUserById(session.userId);

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return { user, sessionId };
  } catch (error) {
    console.error("Error in requireAuth middleware:", error);
    return new Response(JSON.stringify({ error: "Authentication error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Middleware to optionally get user (doesn't require auth)
 */
export async function optionalAuth(
  request: Request,
): Promise<{ user: User | null; sessionId: string | null }> {
  const sessionId = getSessionIdFromRequest(request);

  if (!sessionId) {
    return { user: null, sessionId: null };
  }

  try {
    const session = await getUserSession(sessionId);

    if (!session) {
      return { user: null, sessionId: null };
    }

    // Update session activity
    await updateSessionActivity(sessionId);

    // Get user data
    const user = await findUserById(session.userId);

    return { user, sessionId };
  } catch (error) {
    console.error("Error in optionalAuth middleware:", error);
    return { user: null, sessionId: null };
  }
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
  const isProduction = Deno.env.get("DENO_DEPLOYMENT_ID") ||
    Deno.env.get("NODE_ENV") === "production";
  const secureFlag = isProduction ? "; Secure" : "";

  headers.set(
    "Set-Cookie",
    `session=${sessionId}; HttpOnly${secureFlag}; SameSite=Strict; Max-Age=${
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
  const isProduction = Deno.env.get("DENO_DEPLOYMENT_ID") ||
    Deno.env.get("NODE_ENV") === "production";
  const secureFlag = isProduction ? "; Secure" : "";

  headers.set(
    "Set-Cookie",
    `session=; HttpOnly${secureFlag}; SameSite=Strict; Max-Age=0; Path=/`,
  );

  return new Response(body, {
    ...responseInit,
    headers,
  });
}
