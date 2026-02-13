/// <reference lib="deno.ns" />
import { assertEquals } from "jsr:@std/assert";
import {
  setCreateImportJobForTests,
  setReadImportJobStatusForTests,
  submitImportUrl,
} from "./import_url_form.tsx";
import {
  IMPORT_SERVICE_UNAVAILABLE_ERROR,
  INVALID_IMPORT_URL_ERROR,
  UNSUPPORTED_IMPORT_SOURCE_ERROR,
} from "../contracts/imports.ts";

Deno.test("submitImportUrl returns persisted status when submit and readback succeed", async () => {
  try {
    setCreateImportJobForTests(async (sourceUrl) => ({
      jobId: "job123",
      sourceUrl,
      status: "queued",
    }));
    setReadImportJobStatusForTests(async (jobId) => ({
      jobId,
      sourceUrl: "https://www.liquor.com/recipes/negroni/",
      status: "queued",
    }));

    const outcome = await submitImportUrl(
      "https://www.liquor.com/recipes/negroni/",
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
  } finally {
    setCreateImportJobForTests(null);
    setReadImportJobStatusForTests(null);
  }
});

Deno.test("submitImportUrl rejects invalid URLs before backend write", async () => {
  const outcome = await submitImportUrl("not-a-url");

  assertEquals(outcome, {
    result: null,
    error: INVALID_IMPORT_URL_ERROR,
    clearSourceUrl: false,
  });
});

Deno.test("submitImportUrl rejects unsupported domains before backend write", async () => {
  const outcome = await submitImportUrl("https://example.com/negroni");

  assertEquals(outcome, {
    result: null,
    error: UNSUPPORTED_IMPORT_SOURCE_ERROR,
    clearSourceUrl: false,
  });
});

Deno.test("submitImportUrl returns controlled unavailable error when backend write fails", async () => {
  try {
    setCreateImportJobForTests(async () => {
      throw new Error("backend unavailable");
    });

    const outcome = await submitImportUrl(
      "https://www.liquor.com/recipes/negroni/",
    );

    assertEquals(outcome, {
      result: null,
      error: IMPORT_SERVICE_UNAVAILABLE_ERROR,
      clearSourceUrl: false,
    });
  } finally {
    setCreateImportJobForTests(null);
  }
});

Deno.test("submitImportUrl keeps queued result and surfaces refresh error when status readback fails", async () => {
  try {
    setCreateImportJobForTests(async (sourceUrl) => ({
      jobId: "job123",
      sourceUrl,
      status: "queued",
    }));
    setReadImportJobStatusForTests(async () => {
      throw new Error("status unavailable");
    });

    const outcome = await submitImportUrl(
      "https://www.liquor.com/recipes/negroni/",
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
  } finally {
    setCreateImportJobForTests(null);
    setReadImportJobStatusForTests(null);
  }
});
