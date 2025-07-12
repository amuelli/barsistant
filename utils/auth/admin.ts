import { User } from "../../types/user.ts";
import { requireAuth } from "./middleware.ts";

/**
 * Check if a user is an admin based on the ADMIN_EMAIL environment variable
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;

  const adminEmail = Deno.env.get("ADMIN_EMAIL");
  if (!adminEmail) return false;

  return user.email.toLowerCase() === adminEmail.toLowerCase();
}

/**
 * Middleware to require admin authentication
 * Returns the authenticated admin user or an error response
 */
export async function requireAdmin(
  request: Request,
): Promise<{ user: User; sessionId: string } | Response> {
  // First require regular authentication
  const authResult = await requireAuth(request);

  // If auth failed, return the error response
  if (authResult instanceof Response) {
    return authResult;
  }

  const { user, sessionId } = authResult;

  // Check if user is admin
  if (!isAdmin(user)) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { user, sessionId };
}

/**
 * Check if the current user from request is an admin
 * This is a convenience function for use in handlers where you already have the user
 */
export function checkAdminFromUser(user: User | null): boolean {
  return isAdmin(user);
}
