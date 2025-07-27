import { createSessionResponse } from "🛠️/auth/middleware.ts";
import { createUserSession } from "🛠️/auth/session.ts";
import { validateMagicLinkToken } from "🛠️/auth/token.ts";
import {
  createUser,
  findUserByEmail,
  updateUserLastLogin,
} from "🛠️/auth/user.ts";
import { define } from "🛠️/define.ts";
import VerifyCode from "🏝️/VerifyCode.tsx";

interface VerifyPageData {
  success: false;
  message: string;
  error: string;
  showCodeForm?: boolean;
}

export const handler = define.handlers({
  async GET(ctx) {
    ctx.state.title = "Verify Sign In";

    const url = new URL(ctx.req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      // No code in URL, show the code entry form
      return {
        data: {
          success: false,
          message: "Enter your verification code",
          error: "missing_code",
          showCodeForm: true,
        } as VerifyPageData,
      };
    }

    try {
      // Validate the verification code
      const tokenData = await validateMagicLinkToken(code);

      if (!tokenData) {
        return {
          data: {
            success: false,
            message: "Invalid or expired code",
            error: "invalid_code",
            showCodeForm: true,
          } as VerifyPageData,
        };
      }

      // If email is provided in URL, verify it matches
      const emailParam = url.searchParams.get("email");
      if (emailParam && tokenData.email !== emailParam) {
        return {
          data: {
            success: false,
            message: "Invalid code for this email address",
            error: "email_mismatch",
            showCodeForm: true,
          } as VerifyPageData,
        };
      }

      // Find or create user
      let user = await findUserByEmail(tokenData.email);

      if (!user) {
        // Create new user
        user = await createUser(tokenData.email);
      }

      // Update last login for user
      await updateUserLastLogin(user.id);

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
          message: "Failed to verify code",
          error: "verification_failed",
          showCodeForm: true,
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

          {data.showCodeForm
            ? <VerifyCode initialMessage={data.message} />
            : (
              <div class="space-y-4">
                <div class="alert alert-error">
                  <span>{data.message}</span>
                </div>

                <div class="space-y-4">
                  <p class="text-sm text-base-content/70">
                    Your magic link may have expired or the button might not
                    work in your email client.
                  </p>
                  <a href="/auth/verify" class="btn btn-primary">
                    Enter Verification Code
                  </a>
                  <p class="text-sm text-base-content/50">
                    Check your email for the 8-digit code
                  </p>
                </div>

                <div class="divider">OR</div>

                <a href="/auth/login" class="btn btn-outline btn-primary">
                  Request New Code
                </a>
              </div>
            )}

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
