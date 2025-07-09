import { FreshContext } from "fresh";
import { deleteUserSession } from "../../../utils/auth/session.ts";
import { createLogoutResponse } from "../../../utils/auth/middleware.ts";

interface LogoutResponse {
  success: boolean;
  message: string;
}

export async function handler(ctx: FreshContext): Promise<Response> {
  if (ctx.req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get session ID from cookie
    const cookies = ctx.req.headers.get("cookie") || "";
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : null;

    if (sessionId) {
      // Delete the session from database
      await deleteUserSession(sessionId);
    }

    const response: LogoutResponse = {
      success: true,
      message: "Logged out successfully",
    };

    // Clear session cookie using helper
    return createLogoutResponse(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error during logout:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to logout",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
