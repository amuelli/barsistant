import { FreshContext } from "fresh";
import { State } from "../utils.ts";
import { optionalAuth } from "../utils/auth/middleware.ts";

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
