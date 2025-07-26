import { FreshContext } from "fresh";
import { optionalAuth } from "🛠️/auth/middleware.ts";
import { State } from "🛠️/define.ts";

export async function handler(
  ctx: FreshContext<State>,
) {
  // Get user from session for all requests
  const { user } = await optionalAuth(ctx.req);

  // Set user in context state so it's available to _app.tsx
  ctx.state.user = user;

  // Continue to next handler
  return await ctx.next();
}
