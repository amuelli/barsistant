/// <reference lib="deno.ns" />
import { assert, assertThrows } from "jsr:@std/assert";
import {
  getConvexClient,
  resetConvexClientForTests,
} from "./client.ts";

Deno.test("getConvexClient reuses one client instance", () => {
  const runtime = globalThis as {
    process?: { env?: { NEXT_PUBLIC_CONVEX_URL?: string } };
  };
  const previousProcess = runtime.process;

  try {
    runtime.process = {
      env: {
        NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
      },
    };

    resetConvexClientForTests();

    const firstClient = getConvexClient();
    const secondClient = getConvexClient();

    assert(firstClient === secondClient);
  } finally {
    resetConvexClientForTests();
    runtime.process = previousProcess;
  }
});

Deno.test("getConvexClient throws when NEXT_PUBLIC_CONVEX_URL is missing", () => {
  const runtime = globalThis as {
    process?: { env?: { NEXT_PUBLIC_CONVEX_URL?: string } };
  };
  const previousProcess = runtime.process;

  try {
    runtime.process = { env: {} };
    resetConvexClientForTests();

    assertThrows(
      () => getConvexClient(),
      Error,
      "NEXT_PUBLIC_CONVEX_URL is required",
    );
  } finally {
    resetConvexClientForTests();
    runtime.process = previousProcess;
  }
});
