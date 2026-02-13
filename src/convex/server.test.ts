/// <reference lib="deno.ns" />
import { assert, assertThrows } from "jsr:@std/assert";
import {
  getConvexServerClient,
  resetConvexServerClientForTests,
} from "./server.ts";

Deno.test("getConvexServerClient reuses one client instance", () => {
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

    resetConvexServerClientForTests();

    const firstClient = getConvexServerClient();
    const secondClient = getConvexServerClient();

    assert(firstClient === secondClient);
  } finally {
    resetConvexServerClientForTests();
    runtime.process = previousProcess;
  }
});

Deno.test("getConvexServerClient throws when NEXT_PUBLIC_CONVEX_URL is missing", () => {
  const runtime = globalThis as {
    process?: { env?: { NEXT_PUBLIC_CONVEX_URL?: string } };
  };
  const previousProcess = runtime.process;

  try {
    runtime.process = { env: {} };
    resetConvexServerClientForTests();

    assertThrows(
      () => getConvexServerClient(),
      Error,
      "NEXT_PUBLIC_CONVEX_URL is required",
    );
  } finally {
    resetConvexServerClientForTests();
    runtime.process = previousProcess;
  }
});

Deno.test(
  "getConvexServerClient throws when NEXT_PUBLIC_CONVEX_URL uses unsupported protocol",
  () => {
    const runtime = globalThis as {
      process?: { env?: { NEXT_PUBLIC_CONVEX_URL?: string } };
    };
    const previousProcess = runtime.process;

    try {
      runtime.process = {
        env: { NEXT_PUBLIC_CONVEX_URL: "ftp://example.com" },
      };
      resetConvexServerClientForTests();

      assertThrows(
        () => getConvexServerClient(),
        Error,
        "NEXT_PUBLIC_CONVEX_URL must use http or https",
      );
    } finally {
      resetConvexServerClientForTests();
      runtime.process = previousProcess;
    }
  },
);
