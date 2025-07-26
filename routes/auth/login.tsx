import { page } from "fresh";
import Login from "🏝️/Login.tsx";
import { define } from "🛠️/define.ts";

export const handler = define.handlers({
  GET(ctx) {
    ctx.state.title = "Sign In";
    return page();
  },
});

export default define.page<typeof handler>(
  () => {
    return <Login />;
  },
);
