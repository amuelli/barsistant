export const IMPORT_JOB_QUEUED_STATUS = "queued";

export const SUPPORTED_IMPORT_SOURCE_DOMAINS = [
  "liquor.com",
  "diffordsguide.com",
] as const;

export const INVALID_IMPORT_URL_ERROR =
  "Provide a valid sourceUrl using http or https.";

export const UNSUPPORTED_IMPORT_SOURCE_ERROR =
  "Source domain is not supported yet. Supported domains: liquor.com, diffordsguide.com.";

export const IMPORT_SERVICE_UNAVAILABLE_ERROR =
  "Import service is temporarily unavailable. Please try again.";

export const IMPORT_JOB_NOT_FOUND_ERROR = "Import job was not found.";

export const INVALID_IMPORT_JOB_ID_ERROR = "Provide a valid import job id.";
