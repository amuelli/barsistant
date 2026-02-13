import { makeFunctionReference } from "convex/server";
import {
  IMPORT_SERVICE_UNAVAILABLE_ERROR,
  INVALID_IMPORT_URL_ERROR,
  SUPPORTED_IMPORT_SOURCE_DOMAINS,
  UNSUPPORTED_IMPORT_SOURCE_ERROR,
} from "../../../contracts/imports.ts";

const ALLOWED_SOURCE_HOSTS = new Set(
  SUPPORTED_IMPORT_SOURCE_DOMAINS.flatMap((
    domain,
  ) => [domain, `www.${domain}`]),
);

type ImportRequest = {
  sourceUrl?: unknown;
};

type CreateImportJobResult = {
  jobId: string;
  sourceUrl: string;
  status: string;
};

const createImportJobMutationReference = makeFunctionReference<
  "mutation",
  { sourceUrl: string },
  CreateImportJobResult
>("importJobs:createImportJob");

let createImportJob: (
  sourceUrl: string,
) => Promise<CreateImportJobResult> = defaultCreateImportJob;

export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request);
  const validation = validateSourceUrl(body?.sourceUrl);

  if (validation.kind === "invalid_url") {
    return Response.json(
      {
        error: INVALID_IMPORT_URL_ERROR,
      },
      { status: 400 },
    );
  }

  if (validation.kind === "unsupported_domain") {
    return Response.json(
      {
        error: UNSUPPORTED_IMPORT_SOURCE_ERROR,
      },
      { status: 400 },
    );
  }

  try {
    const job = await createImportJob(validation.sourceUrl);
    return Response.json(
      {
        jobId: job.jobId,
        status: job.status,
        sourceUrl: job.sourceUrl,
      },
      { status: 202 },
    );
  } catch {
    return Response.json(
      {
        error: IMPORT_SERVICE_UNAVAILABLE_ERROR,
      },
      { status: 503 },
    );
  }
}

async function parseJsonBody(request: Request): Promise<ImportRequest | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

type SourceUrlValidation =
  | { kind: "ok"; sourceUrl: string }
  | { kind: "invalid_url" }
  | { kind: "unsupported_domain" };

function validateSourceUrl(value: unknown): SourceUrlValidation {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { kind: "invalid_url" };
  }

  const trimmed = value.trim();

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { kind: "invalid_url" };
    }
    if (!ALLOWED_SOURCE_HOSTS.has(parsed.hostname)) {
      return { kind: "unsupported_domain" };
    }
    return { kind: "ok", sourceUrl: parsed.toString() };
  } catch {
    return { kind: "invalid_url" };
  }
}

export function setCreateImportJobForTests(
  fn: ((sourceUrl: string) => Promise<CreateImportJobResult>) | null,
): void {
  createImportJob = fn ?? defaultCreateImportJob;
}

async function defaultCreateImportJob(
  sourceUrl: string,
): Promise<CreateImportJobResult> {
  const { getConvexServerClient } = await import("../../../convex/server.ts");

  return getConvexServerClient().mutation(
    createImportJobMutationReference,
    { sourceUrl },
  );
}
