import { APP_SHELL_MARKER } from "../src/contracts/app_shell.ts";
import {
  IMPORT_JOB_QUEUED_STATUS,
  SUPPORTED_IMPORT_SOURCE_DOMAINS,
} from "../src/contracts/imports.ts";

const port = Deno.env.get("SMOKE_PORT") ?? "3401";
const healthUrl = `http://127.0.0.1:${port}/api/health`;
const homeUrl = `http://127.0.0.1:${port}/`;
const importsUrl = `http://127.0.0.1:${port}/api/imports`;
const smokeImportSourceUrl = `https://${SUPPORTED_IMPORT_SOURCE_DOMAINS[0]}/recipes/smoke-check/`;

const app = new Deno.Command("deno", {
  args: ["run", "-A", "npm:next", "start", "-p", port],
  stdout: "inherit",
  stderr: "inherit",
}).spawn();

try {
  await waitForHealthyResponse(healthUrl, 20_000);
  await waitForHomeResponse(homeUrl, APP_SHELL_MARKER, 20_000);
  await waitForImportSubmissionResponse(
    importsUrl,
    smokeImportSourceUrl,
    IMPORT_JOB_QUEUED_STATUS,
    20_000,
  );
  console.log(
    `Smoke check passed: ${healthUrl}, ${homeUrl} (marker: ${APP_SHELL_MARKER}), and ${importsUrl} (status: ${IMPORT_JOB_QUEUED_STATUS})`,
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
          payload?.status === expectedStatus
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
    `Timed out waiting for import submission response at ${url}`,
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
