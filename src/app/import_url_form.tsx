"use client";

import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import type { GenericId } from "convex/values";
import {
  IMPORT_SERVICE_UNAVAILABLE_ERROR,
  INVALID_IMPORT_URL_ERROR,
  UNSUPPORTED_IMPORT_SOURCE_ERROR,
} from "../contracts/imports.ts";
import { validateSourceUrl } from "../imports/source_url_validation.ts";

type ConvexApi = typeof import("../convex/api.ts")["api"];

type CreateImportJobResult = FunctionReturnType<
  ConvexApi["importJobs"]["createImportJob"]
>;

type ReadImportJobStatusResult = FunctionReturnType<
  ConvexApi["importJobs"]["getImportJob"]
>;

type ImportResponse = Exclude<ReadImportJobStatusResult, null>;

type SubmitImportOutcome = {
  result: ImportResponse | null;
  error: string | null;
  clearSourceUrl: boolean;
};

let createImportJob: (
  sourceUrl: string,
) => Promise<CreateImportJobResult> = defaultCreateImportJob;

let readImportJobStatus: (
  jobId: GenericId<"importJobs">,
) => Promise<ReadImportJobStatusResult> = defaultReadImportJobStatus;

export async function submitImportUrl(
  sourceUrl: string,
): Promise<SubmitImportOutcome> {
  const validation = validateSourceUrl(sourceUrl);

  if (validation.kind === "invalid_url") {
    return {
      result: null,
      error: INVALID_IMPORT_URL_ERROR,
      clearSourceUrl: false,
    };
  }

  if (validation.kind === "unsupported_domain") {
    return {
      result: null,
      error: UNSUPPORTED_IMPORT_SOURCE_ERROR,
      clearSourceUrl: false,
    };
  }

  let submission: ImportResponse;
  try {
    submission = await createImportJob(validation.sourceUrl);
  } catch {
    return {
      result: null,
      error: IMPORT_SERVICE_UNAVAILABLE_ERROR,
      clearSourceUrl: false,
    };
  }

  try {
    const status = await readImportJobStatus(submission.jobId);
    if (!status) {
      return {
        result: submission,
        error: "Import queued, but status refresh failed.",
        clearSourceUrl: true,
      };
    }

    return {
      result: status,
      error: null,
      clearSourceUrl: true,
    };
  } catch {
    return {
      result: submission,
      error: "Import queued, but status refresh failed.",
      clearSourceUrl: true,
    };
  }
}

export function setCreateImportJobForTests(
  fn: ((sourceUrl: string) => Promise<CreateImportJobResult>) | null,
): void {
  createImportJob = fn ?? defaultCreateImportJob;
}

export function setReadImportJobStatusForTests(
  fn:
    | ((jobId: GenericId<"importJobs">) => Promise<ReadImportJobStatusResult>)
    | null,
): void {
  readImportJobStatus = fn ?? defaultReadImportJobStatus;
}

async function defaultCreateImportJob(
  sourceUrl: string,
): Promise<CreateImportJobResult> {
  const [{ getConvexClient }, { api }] = await Promise.all([
    import("../convex/client.ts"),
    import("../convex/api.ts"),
  ]);

  return getConvexClient().mutation(
    api.importJobs.createImportJob,
    { sourceUrl },
  );
}

async function defaultReadImportJobStatus(
  jobId: GenericId<"importJobs">,
): Promise<ReadImportJobStatusResult> {
  const [{ getConvexClient }, { api }] = await Promise.all([
    import("../convex/client.ts"),
    import("../convex/api.ts"),
  ]);

  return getConvexClient().query(
    api.importJobs.getImportJob,
    { jobId },
  );
}

export function ImportUrlForm() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    const outcome = await submitImportUrl(sourceUrl);
    setResult(outcome.result);
    setError(outcome.error);
    if (outcome.clearSourceUrl) {
      setSourceUrl("");
    }
    setIsSubmitting(false);
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={onSubmit}>
      <label
        className="block text-sm font-medium text-zinc-700"
        htmlFor="sourceUrl"
      >
        Recipe URL
      </label>
      <input
        id="sourceUrl"
        name="sourceUrl"
        type="url"
        required
        placeholder="https://example.com/cocktail-recipe"
        value={sourceUrl}
        onChange={(event) => setSourceUrl(event.target.value)}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-500"
      >
        {isSubmitting ? "Submitting..." : "Import URL"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {result
        ? (
          <p className="text-sm text-emerald-700">
            Import queued as <code>{result.jobId}</code> ({result.status}).
          </p>
        )
        : null}
    </form>
  );
}
