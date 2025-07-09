/**
 * Email template functions for different types of emails
 */

/**
 * Generate magic link email content
 */
export function generateMagicLinkEmail(
  _email: string,
  magicLinkUrl: string,
  isNewUser: boolean = false,
): { html: string; text: string; subject: string } {
  const subject = isNewUser
    ? "Welcome to Barsistant!"
    : "Your Barsistant login link";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #8B5CF6; }
          .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          .button:hover { background: #7C3AED; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
          .security-note { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🍸 Barsistant</div>
        </div>
        
        <h2>${
    isNewUser ? "Welcome to Barsistant!" : "Sign in to your account"
  }</h2>
        
        <p>Hello,</p>
        
        ${
    isNewUser
      ? "<p>Welcome to Barsistant! We're excited to have you join our community of cocktail enthusiasts.</p>"
      : "<p>You requested to sign in to your Barsistant account.</p>"
  }
        
        <p>Click the button below to ${
    isNewUser ? "complete your registration and " : ""
  }sign in:</p>
        
        <p style="text-align: center;">
          <a href="${magicLinkUrl}" class="button">
            ${isNewUser ? "Complete Registration" : "Sign In"}
          </a>
        </p>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
          ${magicLinkUrl}
        </p>
        
        <div class="security-note">
          <strong>Security Notice:</strong> This link will expire in 15 minutes and can only be used once. 
          If you didn't request this email, you can safely ignore it.
        </div>
        
        <div class="footer">
          <p>Happy mixing! 🍹</p>
          <p>The Barsistant Team</p>
        </div>
      </body>
    </html>
  `;

  const text = `
${isNewUser ? "Welcome to Barsistant!" : "Sign in to your account"}

Hello,

${
    isNewUser
      ? "Welcome to Barsistant! We're excited to have you join our community of cocktail enthusiasts."
      : "You requested to sign in to your Barsistant account."
  }

Click the link below to ${
    isNewUser ? "complete your registration and " : ""
  }sign in:

${magicLinkUrl}

Security Notice: This link will expire in 15 minutes and can only be used once. If you didn't request this email, you can safely ignore it.

Happy mixing! 🍹
The Barsistant Team
  `;

  return { html, text, subject };
}

/**
 * Generate welcome email content for new users
 */
export function generateWelcomeEmail(
  displayName: string,
  _email: string,
): { html: string; text: string; subject: string } {
  const subject = "Welcome to Barsistant - Let's get mixing!";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #8B5CF6; }
          .feature { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 6px; }
          .feature h3 { margin: 0 0 10px 0; color: #8B5CF6; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🍸 Barsistant</div>
        </div>
        
        <h2>Welcome to Barsistant, ${displayName}!</h2>
        
        <p>You've successfully joined Barsistant, your personal cocktail companion. Here's what you can do:</p>
        
        <div class="feature">
          <h3>🔍 Discover Recipes</h3>
          <p>Search through thousands of cocktail recipes or use our AI to extract recipes from your favorite websites and videos.</p>
        </div>
        
        <div class="feature">
          <h3>📚 Build Your Collection</h3>
          <p>Save your favorite recipes, add personal notes, and organize them into collections.</p>
        </div>
        
        <div class="feature">
          <h3>🏠 Track Your Bar</h3>
          <p>Maintain an inventory of your home bar and discover what cocktails you can make with what you have.</p>
        </div>
        
        <div class="feature">
          <h3>🎨 Beautiful Images</h3>
          <p>Generate AI-powered cocktail images to make your recipe collection visually stunning.</p>
        </div>
        
        <p>Ready to start mixing? Head over to Barsistant and explore what's possible!</p>
        
        <div class="footer">
          <p>Cheers to great cocktails! 🍹</p>
          <p>The Barsistant Team</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to Barsistant, ${displayName}!

You've successfully joined Barsistant, your personal cocktail companion. Here's what you can do:

🔍 Discover Recipes
Search through thousands of cocktail recipes or use our AI to extract recipes from your favorite websites and videos.

📚 Build Your Collection
Save your favorite recipes, add personal notes, and organize them into collections.

🏠 Track Your Bar
Maintain an inventory of your home bar and discover what cocktails you can make with what you have.

🎨 Beautiful Images
Generate AI-powered cocktail images to make your recipe collection visually stunning.

Ready to start mixing? Head over to Barsistant and explore what's possible!

Cheers to great cocktails! 🍹
The Barsistant Team
  `;

  return { html, text, subject };
}
