"use client";

import { useState } from "react";

type ImportResponse = {
  jobId: string;
  sourceUrl: string;
  status: string;
};

type SubmitImportOutcome = {
  result: ImportResponse | null;
  error: string | null;
  clearSourceUrl: boolean;
};

export async function submitImportUrl(
  sourceUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<SubmitImportOutcome> {
  try {
    const response = await fetchFn("/api/imports", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ sourceUrl }),
    });
    const payload = await response.json();

    if (!response.ok) {
      return {
        result: null,
        error: payload.error ?? "Import submission failed.",
        clearSourceUrl: false,
      };
    }

    const submission = payload as ImportResponse;

    try {
      const statusResponse = await fetchFn(`/api/imports/${submission.jobId}`);
      const statusPayload = await statusResponse.json();

      if (!statusResponse.ok) {
        return {
          result: submission,
          error: "Import queued, but status refresh failed.",
          clearSourceUrl: true,
        };
      }

      return {
        result: statusPayload as ImportResponse,
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
  } catch {
    return {
      result: null,
      error: "Network error while submitting import.",
      clearSourceUrl: false,
    };
  }
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
