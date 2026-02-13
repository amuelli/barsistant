import { APP_SHELL_MARKER } from "../src/contracts/app_shell.ts";
import {
  IMPORT_SERVICE_UNAVAILABLE_ERROR,
  INVALID_IMPORT_JOB_ID_ERROR,
  IMPORT_JOB_QUEUED_STATUS,
  SUPPORTED_IMPORT_SOURCE_DOMAINS,
} from "../src/contracts/imports.ts";

const port = Deno.env.get("SMOKE_PORT") ?? "3401";
const healthUrl = `http://127.0.0.1:${port}/api/health`;
const homeUrl = `http://127.0.0.1:${port}/`;
const importsUrl = `http://127.0.0.1:${port}/api/imports`;
const importJobStatusBaseUrl = `http://127.0.0.1:${port}/api/imports`;
const invalidImportJobStatusUrl = `${importJobStatusBaseUrl}/invalid-id`;
const smokeImportSourceUrl = `https://${SUPPORTED_IMPORT_SOURCE_DOMAINS[0]}/recipes/smoke-check/`;
const convexUrl = Deno.env.get("NEXT_PUBLIC_CONVEX_URL")?.trim();

const app = new Deno.Command("deno", {
  args: ["run", "-A", "npm:next", "start", "-p", port],
  stdout: "inherit",
  stderr: "inherit",
}).spawn();

try {
  await waitForHealthyResponse(healthUrl, 20_000);
  await waitForHomeResponse(homeUrl, APP_SHELL_MARKER, 20_000);
  if (convexUrl) {
    const submittedJob = await waitForImportSubmissionResponse(
      importsUrl,
      smokeImportSourceUrl,
      IMPORT_JOB_QUEUED_STATUS,
      20_000,
    );
    await waitForImportJobStatusResponse(
      `${importJobStatusBaseUrl}/${submittedJob.jobId}`,
      submittedJob,
      20_000,
    );
  } else {
    await waitForImportSubmissionUnavailableResponse(
      importsUrl,
      smokeImportSourceUrl,
      IMPORT_SERVICE_UNAVAILABLE_ERROR,
      20_000,
    );
  }
  await waitForInvalidImportJobIdResponse(
    invalidImportJobStatusUrl,
    INVALID_IMPORT_JOB_ID_ERROR,
    20_000,
  );
  console.log(
    `Smoke check passed: ${healthUrl}, ${homeUrl} (marker: ${APP_SHELL_MARKER}), ${importsUrl} (${convexUrl ? `status: ${IMPORT_JOB_QUEUED_STATUS}` : "controlled unavailable response"}), and invalid import job id contract`,
  );
} finally {
  app.kill("SIGTERM");
  await app.status.catch(() => null);
}

async function waitForHealthyResponse(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const payload = await response.json();
        if (payload?.status === "ok") {
          return;
        }
      }
    } catch {
      // Server is still booting.
    }

    await sleep(500);
  }

  throw new Error(`Timed out waiting for health response at ${url}`);
}

async function waitForHomeResponse(url, marker, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      const contentType = response.headers.get("content-type") ?? "";
      if (response.ok && contentType.includes("text/html")) {
        const body = await response.text();
        if (body.includes(marker)) {
          return;
        }
      }
    } catch {
      // Server is still booting.
    }

    await sleep(500);
  }

  throw new Error(
    `Timed out waiting for HTML shell marker "${marker}" at ${url}`,
  );
}

async function waitForImportSubmissionResponse(
  url,
  sourceUrl,
  expectedStatus,
  timeoutMs,
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ sourceUrl }),
      });
      if (response.status === 202) {
        const payload = await response.json();
        if (
          typeof payload?.jobId === "string" &&
          payload?.status === expectedStatus &&
          payload?.sourceUrl === sourceUrl
        ) {
          return payload;
        }
      }
    } catch {
      // Server is still booting.
    }

    await sleep(500);
  }

  throw new Error(
    `Timed out waiting for import submission response at ${url}`,
  );
}

async function waitForImportJobStatusResponse(url, expectedJob, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        const payload = await response.json();
        if (
          payload?.jobId === expectedJob.jobId &&
          payload?.sourceUrl === expectedJob.sourceUrl &&
          payload?.status === expectedJob.status
        ) {
          return;
        }
      }
    } catch {
      // Server is still booting.
    }

    await sleep(500);
  }

  throw new Error(
    `Timed out waiting for import job status response at ${url}`,
  );
}

async function waitForImportSubmissionUnavailableResponse(
  url,
  sourceUrl,
  expectedError,
  timeoutMs,
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ sourceUrl }),
      });
      if (response.status === 503) {
        const payload = await response.json();
        if (payload?.error === expectedError) {
          return;
        }
      }
    } catch {
      // Server is still booting.
    }

    await sleep(500);
  }

  throw new Error(
    `Timed out waiting for controlled import unavailable response at ${url}`,
  );
}

async function waitForInvalidImportJobIdResponse(url, expectedError, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status === 400) {
        const payload = await response.json();
        if (payload?.error === expectedError) {
          return;
        }
      }
    } catch {
      // Server is still booting.
    }

    await sleep(500);
  }

  throw new Error(
    `Timed out waiting for invalid import job id response at ${url}`,
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
