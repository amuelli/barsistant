import { createUserSession } from "🛠️/auth/session.ts";
import { validateMagicLinkToken } from "🛠️/auth/token.ts";
import {
  createUser,
  findUserByEmail,
  updateUserLastLogin,
} from "🛠️/auth/user.ts";
import { define } from "🛠️/define.ts";

interface VerifyMagicLinkRequest {
  token: string;
}

interface VerifyMagicLinkResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
}

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const body: VerifyMagicLinkRequest = await ctx.req.json();

      if (!body.token || typeof body.token !== "string") {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Token is required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Validate the magic link token
      const tokenData = await validateMagicLinkToken(body.token);

      if (!tokenData) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid or expired token",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Find or create user
      let user = await findUserByEmail(tokenData.email);
      let isNewUser = false;

      if (!user) {
        // Create new user
        user = await createUser(tokenData.email);
        isNewUser = true;
      }

      // Update last login for user
      await updateUserLastLogin(user.id);

      // Create session
      const session = await createUserSession(user.id, user.email);

      const response: VerifyMagicLinkResponse = {
        success: true,
        message: isNewUser
          ? "Account created successfully"
          : "Login successful",
        sessionId: session.id,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
      };

      // Set session cookie
      const responseHeaders = new Headers({
        "Content-Type": "application/json",
        "Set-Cookie":
          `session=${session.id}; HttpOnly; Secure; SameSite=Strict; Max-Age=${
            30 * 24 * 60 * 60
          }; Path=/`,
      });

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("Error verifying magic link:", error);

      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to verify magic link",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
