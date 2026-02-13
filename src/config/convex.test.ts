/// <reference lib="deno.ns" />
import { assertEquals, assertThrows } from "jsr:@std/assert";
import { resolveConvexUrl } from "./convex.ts";

Deno.test("resolveConvexUrl returns normalized URL for valid NEXT_PUBLIC_CONVEX_URL", () => {
  const result = resolveConvexUrl({
    NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud/",
  });

  assertEquals(result, "https://example.convex.cloud/");
});

Deno.test("resolveConvexUrl throws when NEXT_PUBLIC_CONVEX_URL is missing", () => {
  assertThrows(
    () => resolveConvexUrl({ NEXT_PUBLIC_CONVEX_URL: undefined }),
    Error,
    "NEXT_PUBLIC_CONVEX_URL is required",
  );
});

Deno.test("resolveConvexUrl throws when NEXT_PUBLIC_CONVEX_URL is not a URL", () => {
  assertThrows(
    () => resolveConvexUrl({ NEXT_PUBLIC_CONVEX_URL: "not-a-url" }),
    Error,
    "NEXT_PUBLIC_CONVEX_URL must be a valid absolute URL",
  );
});

Deno.test("resolveConvexUrl throws when NEXT_PUBLIC_CONVEX_URL has unsupported protocol", () => {
  assertThrows(
    () => resolveConvexUrl({ NEXT_PUBLIC_CONVEX_URL: "ftp://example.com" }),
    Error,
    "NEXT_PUBLIC_CONVEX_URL must use http or https",
  );
});
