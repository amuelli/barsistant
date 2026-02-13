/// <reference lib="deno.ns" />
import { assertStringIncludes } from "jsr:@std/assert";

Deno.test("AppProviders skips Convex client initialization during server prerender", async () => {
  const providersSource = await Deno.readTextFile(
    new URL("./providers.tsx", import.meta.url),
  );

  assertStringIncludes(providersSource, 'if (typeof window === "undefined")');
  assertStringIncludes(providersSource, "return <>{children}</>;");
});
