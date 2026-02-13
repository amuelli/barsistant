/// <reference lib="deno.ns" />
import { assertEquals, assertStrictEquals } from "jsr:@std/assert";
import { AppProviders } from "./providers.tsx";
import { RootLayoutView } from "./root_layout_view.tsx";

Deno.test("root layout wraps children in AppProviders", () => {
  const child = <main data-testid="child">child</main>;
  const root = RootLayoutView({ children: child });
  const body = root.props.children;
  const providers = body.props.children;

  assertEquals(root.type, "html");
  assertEquals(root.props.lang, "en");
  assertEquals(body.type, "body");
  assertEquals(body.props.className, "antialiased");
  assertStrictEquals(providers.type, AppProviders);
  assertStrictEquals(providers.props.children, child);
});
