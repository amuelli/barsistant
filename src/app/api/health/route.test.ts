/// <reference lib="deno.ns" />
import { assertEquals } from "jsr:@std/assert";
import { GET } from "./route.ts";

Deno.test("health route returns ok status payload", async () => {
  const response = await GET();

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { status: "ok" });
});
