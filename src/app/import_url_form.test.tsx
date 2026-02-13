/// <reference lib="deno.ns" />
import { assertEquals } from "jsr:@std/assert";
import { submitImportUrl } from "./import_url_form.tsx";

Deno.test("submitImportUrl returns persisted status when submit and readback succeed", async () => {
  const calls: string[] = [];
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

    if (url === "/api/imports/job123") {
      return Promise.resolve(
        Response.json(
          {
            jobId: "job123",
            sourceUrl: "https://www.liquor.com/recipes/negroni/",
            status: "queued",
          },
          { status: 200 },
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
  assertEquals(calls, ["/api/imports", "/api/imports/job123"]);
});

Deno.test("submitImportUrl keeps queued result and surfaces refresh error when status readback fails", async () => {
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

    if (url === "/api/imports/job123") {
      return Promise.resolve(
        Response.json(
          { error: "backend_unavailable" },
          { status: 503 },
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
});
