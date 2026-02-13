/// <reference lib="deno.ns" />
import { assertStringIncludes } from "jsr:@std/assert";
import { APP_SHELL_JSX_ATTRIBUTE } from "../contracts/app_shell.ts";

Deno.test("home app shell exposes the expected marker contract", async () => {
  const pageSource = await Deno.readTextFile(
    new URL("./page.tsx", import.meta.url),
  );

  assertStringIncludes(pageSource, APP_SHELL_JSX_ATTRIBUTE);
});
