import { page } from "fresh";
import { define } from "../../utils.ts";
import Login from "🏝️/Login.tsx";

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
