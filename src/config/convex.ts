const NEXT_PUBLIC_CONVEX_URL_ENV = "NEXT_PUBLIC_CONVEX_URL";
type ConvexEnv = { NEXT_PUBLIC_CONVEX_URL?: string };
declare const process: { env: ConvexEnv };

export function resolveConvexUrl(env: ConvexEnv): string {
  const raw = env.NEXT_PUBLIC_CONVEX_URL;
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error(
      `${NEXT_PUBLIC_CONVEX_URL_ENV} is required. Run \`npx convex dev\` locally or set it in Deno Deploy runtime environment variables.`,
    );
  }

  const trimmed = raw.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      `${NEXT_PUBLIC_CONVEX_URL_ENV} must be a valid absolute URL. Received: ${
        JSON.stringify(raw)
      }.`,
    );
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(
      `${NEXT_PUBLIC_CONVEX_URL_ENV} must use http or https. Received protocol: ${parsed.protocol}`,
    );
  }

  // Convex clients append API paths internally; avoid accidental double slashes.
  const normalizedPath = parsed.pathname.replace(/\/+$/, "");
  return `${parsed.origin}${normalizedPath}${parsed.search}${parsed.hash}`;
}

export function getRequiredConvexUrl(): string {
  return resolveConvexUrl({
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  });
}
