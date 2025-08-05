#!/usr/bin/env -S deno run --allow-read --allow-env --allow-run

/**
 * Setup script for GitHub MCP server integration with Claude Code
 *
 * This script:
 * 1. Loads the GitHub Personal Access Token from .env
 * 2. Configures the GitHub MCP server using Claude Code CLI
 * 3. Provides feedback on success/failure
 */

// Load environment variables from .env file
if (!Deno.env.get("DENO_DEPLOYMENT_ID")) {
  await import("@std/dotenv/load");
}

const GITHUB_TOKEN = Deno.env.get("GITHUB_PERSONAL_ACCESS_TOKEN");

if (!GITHUB_TOKEN) {
  console.error(
    "❌ Error: GITHUB_PERSONAL_ACCESS_TOKEN not found in environment",
  );
  console.error("\nPlease add your GitHub Personal Access Token to .env:");
  console.error("GITHUB_PERSONAL_ACCESS_TOKEN=your-github-pat-here");
  console.error("\nTo create a token:");
  console.error(
    "1. Go to GitHub Settings → Developer settings → Personal access tokens",
  );
  console.error("2. Create a fine-grained token with repo access");
  Deno.exit(1);
}

console.log("🔧 Setting up GitHub MCP server for Claude Code...\n");

// Build the command to add the GitHub MCP server
const command = new Deno.Command("claude", {
  args: [
    "mcp",
    "add",
    "github",
    "-s",
    "project", // Project scope
    "-e",
    `GITHUB_PERSONAL_ACCESS_TOKEN=${GITHUB_TOKEN}`,
    "--",
    "docker",
    "run",
    "-i",
    "--rm",
    "-e",
    "GITHUB_PERSONAL_ACCESS_TOKEN",
    "ghcr.io/github/github-mcp-server",
  ],
  stdout: "piped",
  stderr: "piped",
});

try {
  const { code, stdout, stderr } = await command.output();

  if (code === 0) {
    console.log("✅ GitHub MCP server configured successfully!");
    console.log("\nYou can verify the installation with:");
    console.log("  claude mcp list");

    const output = new TextDecoder().decode(stdout);
    if (output.trim()) {
      console.log("\n" + output);
    }
  } else {
    console.error("❌ Failed to configure GitHub MCP server");
    const error = new TextDecoder().decode(stderr);
    if (error.includes("already exists")) {
      console.error("\n⚠️  GitHub MCP server is already configured");
      console.error("To reconfigure, first remove it with:");
      console.error("  claude mcp remove github");
      console.error("\nThen run this setup again.");
    } else {
      console.error("\nError:", error);
    }
    Deno.exit(1);
  }
} catch (error) {
  console.error("❌ Error running claude command:", error);
  console.error(
    "\nMake sure Claude Code CLI is installed and available in your PATH",
  );
  Deno.exit(1);
}
