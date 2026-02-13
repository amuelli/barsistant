const QUEUED_STATUS = "queued";
const ALLOWED_SOURCE_HOSTS = new Set([
  "liquor.com",
  "www.liquor.com",
  "diffordsguide.com",
  "www.diffordsguide.com",
]);
const ALLOWLIST_ERROR =
  "Source domain is not supported yet. Supported domains: liquor.com, diffordsguide.com.";

type ImportRequest = {
  sourceUrl?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request);
  const validation = validateSourceUrl(body?.sourceUrl);

  if (validation.kind === "invalid_url") {
    return Response.json(
      {
        error: "Provide a valid sourceUrl using http or https.",
      },
      { status: 400 },
    );
  }

  if (validation.kind === "unsupported_domain") {
    return Response.json(
      {
        error: ALLOWLIST_ERROR,
      },
      { status: 400 },
    );
  }

  return Response.json(
    {
      jobId: crypto.randomUUID(),
      status: QUEUED_STATUS,
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
