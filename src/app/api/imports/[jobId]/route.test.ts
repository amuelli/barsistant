/// <reference lib="deno.ns" />
import { assertEquals } from "jsr:@std/assert";
import {
  IMPORT_JOB_NOT_FOUND_ERROR,
  IMPORT_JOB_QUEUED_STATUS,
  IMPORT_SERVICE_UNAVAILABLE_ERROR,
  INVALID_IMPORT_JOB_ID_ERROR,
} from "../../../../contracts/imports.ts";
import { GET, setGetImportJobForTests } from "./route.ts";

Deno.test("import job route returns persisted job status when found", async () => {
  try {
    setGetImportJobForTests(async (jobId) => ({
      jobId,
      sourceUrl: "https://www.liquor.com/recipes/negroni/",
      status: IMPORT_JOB_QUEUED_STATUS,
    }));

    const response = await GET(
      new Request("http://localhost/api/imports/job_123"),
      { params: { jobId: "job123" } },
    );
    const payload = await response.json();

    assertEquals(response.status, 200);
    assertEquals(payload, {
      jobId: "job123",
      sourceUrl: "https://www.liquor.com/recipes/negroni/",
      status: IMPORT_JOB_QUEUED_STATUS,
    });
  } finally {
    setGetImportJobForTests(null);
  }
});

Deno.test("import job route accepts async route params and returns persisted status when found", async () => {
  try {
    setGetImportJobForTests(async (jobId) => ({
      jobId,
      sourceUrl: "https://www.diffordsguide.com/cocktails/recipe/1234/negroni",
      status: IMPORT_JOB_QUEUED_STATUS,
    }));

    const response = await GET(
      new Request("http://localhost/api/imports/job123"),
      { params: Promise.resolve({ jobId: "job123" }) },
    );
    const payload = await response.json();

    assertEquals(response.status, 200);
    assertEquals(payload, {
      jobId: "job123",
      sourceUrl: "https://www.diffordsguide.com/cocktails/recipe/1234/negroni",
      status: IMPORT_JOB_QUEUED_STATUS,
    });
  } finally {
    setGetImportJobForTests(null);
  }
});

Deno.test("import job route returns not found for unknown job id", async () => {
  try {
    setGetImportJobForTests(async () => null);

    const response = await GET(
      new Request("http://localhost/api/imports/job123"),
      { params: { jobId: "job123" } },
    );
    const payload = await response.json();

    assertEquals(response.status, 404);
    assertEquals(payload, {
      error: IMPORT_JOB_NOT_FOUND_ERROR,
    });
  } finally {
    setGetImportJobForTests(null);
  }
});

Deno.test("import job route rejects invalid job id format", async () => {
  const response = await GET(
    new Request("http://localhost/api/imports/invalid-id"),
    { params: { jobId: "invalid-id" } },
  );
  const payload = await response.json();

  assertEquals(response.status, 400);
  assertEquals(payload, {
    error: INVALID_IMPORT_JOB_ID_ERROR,
  });
});

Deno.test("import job route returns controlled unavailable response on backend failure", async () => {
  try {
    setGetImportJobForTests(async () => {
      throw new Error("backend unavailable");
    });

    const response = await GET(
      new Request("http://localhost/api/imports/job123"),
      { params: { jobId: "job123" } },
    );
    const payload = await response.json();

    assertEquals(response.status, 503);
    assertEquals(payload, {
      error: IMPORT_SERVICE_UNAVAILABLE_ERROR,
    });
  } finally {
    setGetImportJobForTests(null);
  }
});
