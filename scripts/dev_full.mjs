const processes = [
  {
    name: "convex",
    child: new Deno.Command("deno", {
      args: ["run", "-A", "npm:convex", "dev"],
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    }).spawn(),
  },
  {
    name: "next",
    child: new Deno.Command("deno", {
      args: ["run", "-A", "npm:next", "dev"],
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    }).spawn(),
  },
];

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  if (signal) {
    console.log(`\nReceived ${signal}; stopping local dev processes...`);
  }

  for (const process of processes) {
    try {
      process.child.kill("SIGTERM");
    } catch {
      // Child may have already exited.
    }
  }
}

Deno.addSignalListener("SIGINT", () => shutdown("SIGINT"));
Deno.addSignalListener("SIGTERM", () => shutdown("SIGTERM"));

const firstExit = await Promise.race(
  processes.map(async (process) => ({
    name: process.name,
    status: await process.child.status,
  })),
);

if (!shuttingDown) {
  console.error(
    `${firstExit.name} exited early (code=${firstExit.status.code}, success=${firstExit.status.success}); stopping remaining process.`,
  );
  shutdown();
}

const settled = await Promise.all(processes.map((process) => process.child.status));

const failed = settled.find((status) => !status.success);
if (failed) {
  Deno.exit(failed.code);
}
