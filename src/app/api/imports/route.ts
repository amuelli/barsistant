const QUEUED_STATUS = "queued";

type ImportRequest = {
  sourceUrl?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request);
  const sourceUrl = validateSourceUrl(body?.sourceUrl);

  if (!sourceUrl) {
    return Response.json(
      {
        error: "Provide a valid sourceUrl using http or https.",
      },
      { status: 400 },
    );
  }

  return Response.json(
    {
      jobId: crypto.randomUUID(),
      status: QUEUED_STATUS,
      sourceUrl,
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

function validateSourceUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const trimmed = value.trim();

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
