/// <reference lib="deno.ns" />
import { assertEquals, assertStrictEquals } from "jsr:@std/assert";
import { AppProviders } from "./providers.tsx";

Deno.test("AppProviders returns children unchanged during server prerender", () => {
  const child = <main data-testid="child">child</main>;
  const root = AppProviders({ children: child });

  assertStrictEquals(root.type, Symbol.for("react.fragment"));
  assertEquals(root.props.children, child);
});
