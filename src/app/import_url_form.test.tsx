/// <reference lib="deno.ns" />
import { assertEquals } from "jsr:@std/assert";
import {
  setReadImportJobStatusForTests,
  submitImportUrl,
} from "./import_url_form.tsx";

Deno.test("submitImportUrl returns persisted status when submit and readback succeed", async () => {
  const calls: string[] = [];
  setReadImportJobStatusForTests(async (jobId) => ({
    jobId,
    sourceUrl: "https://www.liquor.com/recipes/negroni/",
    status: "queued",
  }));

  const fetchMock: typeof fetch = ((input: string | URL | Request) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;
    calls.push(url);

    if (url === "/api/imports") {
      return Promise.resolve(
        Response.json(
          {
            jobId: "job123",
            sourceUrl: "https://www.liquor.com/recipes/negroni/",
            status: "queued",
          },
          { status: 202 },
        ),
      );
    }
    throw new Error(`Unexpected URL: ${url}`);
  }) as typeof fetch;

  const outcome = await submitImportUrl(
    "https://www.liquor.com/recipes/negroni/",
    fetchMock,
  );

  assertEquals(outcome, {
    result: {
      jobId: "job123",
      sourceUrl: "https://www.liquor.com/recipes/negroni/",
      status: "queued",
    },
    error: null,
    clearSourceUrl: true,
  });
  assertEquals(calls, ["/api/imports"]);
  setReadImportJobStatusForTests(null);
});

Deno.test("submitImportUrl keeps queued result and surfaces refresh error when status readback fails", async () => {
  setReadImportJobStatusForTests(async () => {
    throw new Error("status unavailable");
  });

  const fetchMock: typeof fetch = ((input: string | URL | Request) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

    if (url === "/api/imports") {
      return Promise.resolve(
        Response.json(
          {
            jobId: "job123",
            sourceUrl: "https://www.liquor.com/recipes/negroni/",
            status: "queued",
          },
          { status: 202 },
        ),
      );
    }
    throw new Error(`Unexpected URL: ${url}`);
  }) as typeof fetch;

  const outcome = await submitImportUrl(
    "https://www.liquor.com/recipes/negroni/",
    fetchMock,
  );

  assertEquals(outcome, {
    result: {
      jobId: "job123",
      sourceUrl: "https://www.liquor.com/recipes/negroni/",
      status: "queued",
    },
    error: "Import queued, but status refresh failed.",
    clearSourceUrl: true,
  });
  setReadImportJobStatusForTests(null);
});
