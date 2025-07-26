import { getUserSession } from "🛠️/auth/session.ts";
import { findUserById } from "🛠️/auth/user.ts";
import { define } from "🛠️/define.ts";
import { UserPreferences } from "../../../types/user.ts";

interface MeResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    displayName: string;
    preferences: UserPreferences;
    createdAt: string;
    lastLoginAt?: string;
  };
  message?: string;
}

export const handler = define.handlers({
  async GET(ctx) {
    try {
      // Get session ID from cookie
      const cookies = ctx.req.headers.get("cookie") || "";
      const sessionMatch = cookies.match(/session=([^;]+)/);
      const sessionId = sessionMatch ? sessionMatch[1] : null;

      if (!sessionId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "No session found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Validate session
      const session = await getUserSession(sessionId);

      if (!session) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid session",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Get user data
      const user = await findUserById(session.userId);

      if (!user) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "User not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const response: MeResponse = {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          preferences: user.preferences,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting user data:", error);

      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to get user data",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
