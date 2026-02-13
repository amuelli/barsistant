/// <reference lib="deno.ns" />
import { assertStringIncludes } from "jsr:@std/assert";

const APP_SHELL_MARKER = 'data-app-shell="barsistant-shell-v1"';

Deno.test("home app shell exposes the expected marker contract", async () => {
  const pageSource = await Deno.readTextFile(
    new URL("./page.tsx", import.meta.url),
  );

  assertStringIncludes(pageSource, APP_SHELL_MARKER);
});
