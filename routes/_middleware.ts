import { optionalAuth } from "🛠️/auth/middleware.ts";
import { define } from "🛠️/define.ts";

export default define.middleware(async (ctx) => {
  const { user } = await optionalAuth(ctx.req);

  // Set user in context state so it's available to _app.tsx
  ctx.state.user = user;

  // Continue to next handler
  return await ctx.next();
});
