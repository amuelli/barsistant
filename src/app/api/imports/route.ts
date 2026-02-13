import {
  IMPORT_JOB_QUEUED_STATUS,
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

  return Response.json(
    {
      jobId: crypto.randomUUID(),
      status: IMPORT_JOB_QUEUED_STATUS,
      sourceUrl: validation.sourceUrl,
    },
    { status: 202 },
  );
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
