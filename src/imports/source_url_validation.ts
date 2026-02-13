import { SUPPORTED_IMPORT_SOURCE_DOMAINS } from "../contracts/imports.ts";

const ALLOWED_SOURCE_HOSTS = new Set(
  SUPPORTED_IMPORT_SOURCE_DOMAINS.flatMap((
    domain,
  ) => [domain, `www.${domain}`]),
);

export type SourceUrlValidation =
  | { kind: "ok"; sourceUrl: string }
  | { kind: "invalid_url" }
  | { kind: "unsupported_domain" };

export function validateSourceUrl(value: unknown): SourceUrlValidation {
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
