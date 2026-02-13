const port = Deno.env.get("SMOKE_PORT") ?? "3401";
const healthUrl = `http://127.0.0.1:${port}/api/health`;
const homeUrl = `http://127.0.0.1:${port}/`;
const appShellMarker = "barsistant-shell-v1";

const app = new Deno.Command("deno", {
  args: ["run", "-A", "npm:next", "start", "-p", port],
  stdout: "inherit",
  stderr: "inherit",
}).spawn();

try {
  await waitForHealthyResponse(healthUrl, 20_000);
  await waitForHomeResponse(homeUrl, appShellMarker, 20_000);
  console.log(
    `Smoke check passed: ${healthUrl} and ${homeUrl} (marker: ${appShellMarker})`,
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
