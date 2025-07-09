import { FreshContext } from "fresh";
import { validateMagicLinkToken } from "../../../utils/auth/token.ts";
import {
  createUser,
  findUserByEmail,
  updateUserLastLogin,
} from "../../../utils/auth/user.ts";
import { createUserSession } from "../../../utils/auth/session.ts";
import { sendEmail } from "../../../utils/email/service.ts";
import { generateWelcomeEmail } from "../../../utils/email/templates.ts";

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

export async function handler(ctx: FreshContext): Promise<Response> {
  if (ctx.req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

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

      // Send welcome email for new users
      try {
        const welcomeEmail = generateWelcomeEmail(user.displayName, user.email);
        await sendEmail({
          to: user.email,
          subject: welcomeEmail.subject,
          html: welcomeEmail.html,
          text: welcomeEmail.text,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the registration if welcome email fails
      }
    } else {
      // Update last login for existing user
      await updateUserLastLogin(user.id);
    }

    // Create session
    const session = await createUserSession(user.id, user.email);

    const response: VerifyMagicLinkResponse = {
      success: true,
      message: isNewUser ? "Account created successfully" : "Login successful",
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
}
