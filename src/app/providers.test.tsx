/// <reference lib="deno.ns" />
import { assertEquals, assertStrictEquals } from "jsr:@std/assert";
import { ConvexProvider } from "convex/react";
import { AppProviders } from "./providers.tsx";
import {
  getConvexClient,
  resetConvexClientForTests,
} from "../convex/client.ts";

Deno.test("AppProviders returns children unchanged during server prerender", () => {
  const child = <main data-testid="child">child</main>;
  const root = AppProviders({ children: child });

  assertStrictEquals(root.type, Symbol.for("react.fragment"));
  assertEquals(root.props.children, child);
});

Deno.test("AppProviders wraps children in ConvexProvider in browser runtime", () => {
  const runtime = globalThis as {
    process?: { env?: { NEXT_PUBLIC_CONVEX_URL?: string } };
    window?: Window;
  };
  const previousProcess = runtime.process;
  const previousWindow = runtime.window;
  const child = <main data-testid="child">child</main>;

  try {
    runtime.process = {
      env: {
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
      },
    };
    runtime.window = {} as Window;
    resetConvexClientForTests();

    const root = AppProviders({ children: child });

    assertStrictEquals(root.type, ConvexProvider);
    assertStrictEquals(root.props.client, getConvexClient());
    assertEquals(root.props.children, child);
  } finally {
    resetConvexClientForTests();
    runtime.process = previousProcess;
    runtime.window = previousWindow;
  }
});
