import { createIPRateLimiter, rateLimit } from "🛠️/auth/rate-limit.ts";
import {
  createSecureHeaders,
  getClientIP,
  isLikelyBot,
  isValidEmail,
  logSecurityEvent,
  sanitizeEmail,
  validateOrigin,
} from "🛠️/auth/security.ts";
import { createMagicLinkToken } from "🛠️/auth/token.ts";
import { findUserByEmail } from "🛠️/auth/user.ts";
import { define } from "🛠️/define.ts";
import { sendEmail } from "🛠️/email/service.ts";
import { generateMagicLinkEmail } from "🛠️/email/templates.ts";

interface RequestMagicLinkRequest {
  email: string;
}

interface RequestMagicLinkResponse {
  success: boolean;
  message: string;
}

const rateLimiter = createIPRateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes per IP

export const handler = define.handlers({
  async POST(ctx) {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(rateLimiter)(ctx.req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate origin for CSRF protection
    if (!validateOrigin(ctx.req)) {
      logSecurityEvent("Invalid origin", {
        origin: ctx.req.headers.get("Origin"),
        referer: ctx.req.headers.get("Referer"),
        ip: getClientIP(ctx.req),
      });
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid request origin",
        }),
        {
          status: 403,
          headers: createSecureHeaders({ "Content-Type": "application/json" }),
        },
      );
    }

    // Check for bot requests
    const userAgent = ctx.req.headers.get("User-Agent") || "";
    if (isLikelyBot(userAgent)) {
      logSecurityEvent("Bot request detected", {
        userAgent,
        ip: getClientIP(ctx.req),
      });
      return new Response(
        JSON.stringify({
          success: false,
          message: "Automated requests are not allowed",
        }),
        {
          status: 403,
          headers: createSecureHeaders({ "Content-Type": "application/json" }),
        },
      );
    }

    try {
      const body: RequestMagicLinkRequest = await ctx.req.json();

      if (!body.email || typeof body.email !== "string") {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Email is required",
          }),
          {
            status: 400,
            headers: createSecureHeaders({
              "Content-Type": "application/json",
            }),
          },
        );
      }

      const email = sanitizeEmail(body.email);

      if (!isValidEmail(email)) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid email format",
          }),
          {
            status: 400,
            headers: createSecureHeaders({
              "Content-Type": "application/json",
            }),
          },
        );
      }

      // Check if user exists
      const existingUser = await findUserByEmail(email);
      const isNewUser = !existingUser;

      // Create magic link token with verification code
      const { token: _token, code } = await createMagicLinkToken(
        email,
        existingUser?.id,
      );

      // Generate magic link URL using the code
      const baseUrl = new URL(ctx.req.url).origin;
      const magicLinkUrl = `${baseUrl}/auth/verify?code=${code}`;

      // Generate and send email with verification code
      const emailContent = generateMagicLinkEmail(
        email,
        magicLinkUrl,
        code,
      );
      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      logSecurityEvent("Magic link sent", {
        email,
        isNewUser,
        ip: getClientIP(ctx.req),
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Magic link sent successfully",
        }),
        {
          status: 200,
          headers: createSecureHeaders({ "Content-Type": "application/json" }),
        },
      );
    } catch (error) {
      console.error("Error sending magic link:", error);
      logSecurityEvent("Magic link send failed", {
        error: (error as Error).message,
        ip: getClientIP(ctx.req),
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to send magic link",
        }),
        {
          status: 500,
          headers: createSecureHeaders({ "Content-Type": "application/json" }),
        },
      );
    }
  },
});
