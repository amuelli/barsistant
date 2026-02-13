/// <reference lib="deno.ns" />
import { assertEquals } from "jsr:@std/assert";
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
  assertEquals(payload.status, "queued");
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
    error: "Provide a valid sourceUrl using http or https.",
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
    error:
      "Source domain is not supported yet. Supported domains: liquor.com, diffordsguide.com.",
  });
});
