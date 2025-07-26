import { createSessionResponse } from "🛠️/auth/middleware.ts";
import { createUserSession } from "🛠️/auth/session.ts";
import { validateMagicLinkToken } from "🛠️/auth/token.ts";
import {
  createUser,
  findUserByEmail,
  updateUserLastLogin,
} from "🛠️/auth/user.ts";
import { define } from "🛠️/define.ts";
import { sendEmail } from "🛠️/email/service.ts";
import { generateWelcomeEmail } from "🛠️/email/templates.ts";

interface VerifyPageData {
  success: false;
  message: string;
  error: string;
}

export const handler = define.handlers({
  async GET(ctx) {
    ctx.state.title = "Verify Sign In";

    const url = new URL(ctx.req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return {
        data: {
          success: false,
          message: "No verification token found",
          error: "missing_token",
        } as VerifyPageData,
      };
    }

    try {
      // Validate the magic link token
      const tokenData = await validateMagicLinkToken(token);

      if (!tokenData) {
        return {
          data: {
            success: false,
            message: "Invalid or expired link",
            error: "invalid_token",
          } as VerifyPageData,
        };
      }

      // Find or create user
      let user = await findUserByEmail(tokenData.email);
      let _isNewUser = false;

      if (!user) {
        // Create new user
        user = await createUser(tokenData.email);
        _isNewUser = true;

        // Send welcome email for new users
        try {
          const welcomeEmail = generateWelcomeEmail(
            user.displayName,
            user.email,
          );
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

      // Set session cookie and redirect
      const response = createSessionResponse(
        session.id,
        null,
        {
          status: 302,
          headers: {
            "Location": "/",
          },
        },
      );

      return response;
    } catch (error) {
      console.error("Error verifying magic link:", error);
      return {
        data: {
          success: false,
          message: "Failed to verify magic link",
          error: "verification_failed",
        } as VerifyPageData,
      };
    }
  },
});

export default define.page<typeof handler>(({ data }) => {
  // This page only renders on errors - successful verification redirects
  return (
    <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body text-center">
          <div class="mb-6">
            <h1 class="text-3xl font-bold text-primary mb-2">
              🍸 Barsistant
            </h1>
          </div>

          <div class="space-y-4">
            <div class="alert alert-error">
              <span>{data.message}</span>
            </div>

            <div class="space-y-4">
              <p class="text-sm text-base-content/70">
                Your magic link may have expired or already been used.
              </p>
              <a href="/auth/login" class="btn btn-primary">
                Request New Magic Link
              </a>
            </div>
          </div>

          <div class="mt-6">
            <a href="/" class="link link-hover text-sm">
              Return to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});
