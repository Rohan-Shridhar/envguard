#!/usr/bin/env node

import { analyzeEnv } from "../src/index.js";

/**
 * CLI entry point for envguard scan.
 * Simply calls the public analyzeEnv API with default settings.
 */
async function run() {
  await analyzeEnv({
    envPath: ".env",
    rootDir: "."
  });
}

run();
