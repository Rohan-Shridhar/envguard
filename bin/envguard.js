#!/usr/bin/env node

import { analyzeEnv, startDevServer } from "../src/index.js";

/**
 * CLI entry point for envguard.
 * Supports:
 * - default: Run analysis and print report to console.
 * - dev-ui: Start a local HTTP server for the dashboard.
 */
async function run() {
  const command = process.argv[2];

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
