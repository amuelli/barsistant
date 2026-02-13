export const IMPORT_JOB_QUEUED_STATUS = "queued";

export const SUPPORTED_IMPORT_SOURCE_DOMAINS = [
  "liquor.com",
  "diffordsguide.com",
] as const;

export const INVALID_IMPORT_URL_ERROR =
  "Provide a valid sourceUrl using http or https.";

export const UNSUPPORTED_IMPORT_SOURCE_ERROR =
  "Source domain is not supported yet. Supported domains: liquor.com, diffordsguide.com.";
