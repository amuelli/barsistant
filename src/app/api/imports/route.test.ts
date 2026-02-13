/// <reference lib="deno.ns" />
import { assertEquals } from "jsr:@std/assert";
import {
  IMPORT_JOB_QUEUED_STATUS,
  INVALID_IMPORT_URL_ERROR,
  UNSUPPORTED_IMPORT_SOURCE_ERROR,
} from "../../../contracts/imports.ts";
import { POST } from "./route.ts";

Deno.test("imports route accepts a valid source URL and returns queued status", async () => {
  const request = new Request("http://localhost/api/imports", {
    method: "POST",
    body: JSON.stringify({
      sourceUrl: "https://www.liquor.com/recipes/negroni/",
    }),
    headers: {
      "content-type": "application/json",
    },
  });

  const response = await POST(request);
  const payload = await response.json();

  assertEquals(response.status, 202);
  assertEquals(payload.status, IMPORT_JOB_QUEUED_STATUS);
  assertEquals(
    payload.sourceUrl,
    "https://www.liquor.com/recipes/negroni/",
  );
  assertEquals(typeof payload.jobId, "string");
});

Deno.test("imports route rejects an invalid URL", async () => {
  const request = new Request("http://localhost/api/imports", {
    method: "POST",
    body: JSON.stringify({
      sourceUrl: "not-a-url",
    }),
    headers: {
      "content-type": "application/json",
    },
  });

  const response = await POST(request);
  const payload = await response.json();

  assertEquals(response.status, 400);
  assertEquals(payload, {
    error: INVALID_IMPORT_URL_ERROR,
  });
});

Deno.test("imports route rejects unsupported domains with an actionable message", async () => {
  const request = new Request("http://localhost/api/imports", {
    method: "POST",
    body: JSON.stringify({
      sourceUrl: "https://example.com/negroni",
    }),
    headers: {
      "content-type": "application/json",
    },
  });

  const response = await POST(request);
  const payload = await response.json();

  assertEquals(response.status, 400);
  assertEquals(payload, {
    error: UNSUPPORTED_IMPORT_SOURCE_ERROR,
  });
});

Deno.test("imports route rejects malformed JSON payloads with a validation message", async () => {
  const request = new Request("http://localhost/api/imports", {
    method: "POST",
    body: '{"sourceUrl":',
    headers: {
      "content-type": "application/json",
    },
  });

  const response = await POST(request);
  const payload = await response.json();

  assertEquals(response.status, 400);
  assertEquals(payload, {
    error: INVALID_IMPORT_URL_ERROR,
  });
});
