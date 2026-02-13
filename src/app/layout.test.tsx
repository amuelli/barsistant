/// <reference lib="deno.ns" />
import { assertStringIncludes } from "jsr:@std/assert";

Deno.test("root layout wraps children in AppProviders", async () => {
  const layoutSource = await Deno.readTextFile(
    new URL("./layout.tsx", import.meta.url),
  );

  assertStringIncludes(
    layoutSource,
    'import { AppProviders } from "./providers.tsx";',
  );
  assertStringIncludes(layoutSource, "<AppProviders>{children}</AppProviders>");
});
