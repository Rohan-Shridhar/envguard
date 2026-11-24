#!/usr/bin/env node

import { analyzeEnv, startDevServer } from "../src/index.js";

/**
 * CLI entry point for envguard.
 * Supports:
 * - default: Run analysis and print report to console.
 * - dev-ui: Start a local HTTP server for the dashboard.
 * - --help, -h: Print usage.
 */
async function run() {
  const command = process.argv[2];

  if (command === "--help" || command === "-h") {
    console.log(`Usage:
  envguard             Scan the current project and report .env discrepancies
  envguard dev-ui      Start the local dashboard on port 3000
  envguard --help, -h  Show this help`);
    return;
  }

  if (command === "dev-ui") {
    await startDevServer(3000);
  } else {
    // Default: Scan and report
    await analyzeEnv({
      envPath: ".env",
      rootDir: "."
    });
  }
}

run();
