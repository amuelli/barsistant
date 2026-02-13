/// <reference lib="deno.ns" />
import { assertEquals, assertStrictEquals } from "jsr:@std/assert";
import { APP_SHELL_MARKER } from "../contracts/app_shell.ts";
import { ImportUrlForm } from "./import_url_form.tsx";
import Home from "./page.tsx";

Deno.test("home app shell exposes marker and tracer-bullet structure", () => {
  const root = Home();
  const main = root.props.children;
  const tracerSection = main.props.children[2];
  const tracerHeading = tracerSection.props.children[0];
  const importForm = tracerSection.props.children[2];

  assertEquals(root.type, "div");
  assertEquals(main.type, "main");
  assertEquals(main.props["data-app-shell"], APP_SHELL_MARKER);
  assertEquals(
    tracerHeading.props.children,
    "Tracer bullet: URL import submission",
  );
  assertStrictEquals(importForm.type, ImportUrlForm);
});
