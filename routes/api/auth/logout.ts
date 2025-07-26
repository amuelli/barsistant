import { createLogoutResponse } from "🛠️/auth/middleware.ts";
import { deleteUserSession } from "🛠️/auth/session.ts";
import { define } from "🛠️/define.ts";

interface LogoutResponse {
  success: boolean;
  message: string;
}

export const handler = define.handlers({
  async POST(ctx) {
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
  },
});
