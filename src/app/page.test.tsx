/// <reference lib="deno.ns" />
import { assertEquals } from "jsr:@std/assert";

Deno.test("test runner is configured", () => {
  assertEquals(1 + 1, 2);
});
