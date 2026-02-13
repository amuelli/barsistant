/// <reference lib="deno.ns" />
import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import type { GenericId } from "convex/values";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ImportUrlForm,
  setCreateImportJobForTests,
  setReadImportJobStatusForTests,
  submitImportUrl,
} from "./import_url_form.tsx";
import { resetConvexClientForTests } from "../convex/client.ts";
import {
  IMPORT_SERVICE_UNAVAILABLE_ERROR,
  INVALID_IMPORT_URL_ERROR,
  UNSUPPORTED_IMPORT_SOURCE_ERROR,
} from "../contracts/imports.ts";

const TEST_JOB_ID = "job123" as GenericId<"importJobs">;

Deno.test("ImportUrlForm renders baseline submit controls and helper copy", () => {
  const html = renderToStaticMarkup(<ImportUrlForm />);

  assertStringIncludes(html, 'for="sourceUrl"');
  assertStringIncludes(html, "Recipe URL");
  assertStringIncludes(html, 'id="sourceUrl"');
  assertStringIncludes(html, 'type="url"');
  assertStringIncludes(html, "Import URL");
  assertStringIncludes(html, "https://example.com/cocktail-recipe");
});

Deno.test("submitImportUrl returns persisted status when submit and readback succeed", async () => {
  try {
    setCreateImportJobForTests(async (sourceUrl) => ({
      jobId: TEST_JOB_ID,
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
        jobId: TEST_JOB_ID,
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

Deno.test("submitImportUrl returns controlled unavailable error when Convex URL is missing on default path", async () => {
  const runtime = globalThis as {
    process?: { env?: { NEXT_PUBLIC_CONVEX_URL?: string } };
  };
  const previousProcess = runtime.process;

  try {
    runtime.process = { env: {} };
    resetConvexClientForTests();

    const outcome = await submitImportUrl(
      "https://www.liquor.com/recipes/negroni/",
    );

    assertEquals(outcome, {
      result: null,
      error: IMPORT_SERVICE_UNAVAILABLE_ERROR,
      clearSourceUrl: false,
    });
  } finally {
    resetConvexClientForTests();
    runtime.process = previousProcess;
  }
});

Deno.test("submitImportUrl keeps queued result and surfaces refresh error when status readback fails", async () => {
  try {
    setCreateImportJobForTests(async (sourceUrl) => ({
      jobId: TEST_JOB_ID,
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
        jobId: TEST_JOB_ID,
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

Deno.test("submitImportUrl keeps queued result and surfaces refresh error when status readback returns null", async () => {
  try {
    setCreateImportJobForTests(async (sourceUrl) => ({
      jobId: TEST_JOB_ID,
      sourceUrl,
      status: "queued",
    }));
    setReadImportJobStatusForTests(async () => null);

    const outcome = await submitImportUrl(
      "https://www.liquor.com/recipes/negroni/",
    );

    assertEquals(outcome, {
      result: {
        jobId: TEST_JOB_ID,
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
