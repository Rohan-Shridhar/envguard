#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { parseEnv, scanUsedVars, analyzeEnv } from "../src/index.js";

async function run() {
  const rootDir = process.cwd();
  const envPath = path.join(rootDir, ".env");

  console.log("\n🔍 Scanning codebase for environment variables...\n");

  try {
    // 1. Read and parse .env
    let envContent = "";
    try {
      envContent = await fs.readFile(envPath, "utf8");
    } catch (err) {
      console.warn("⚠️  Warning: .env file not found in current directory.\n");
    }
    const envVars = parseEnv(envContent);

    // 2. Scan codebase
    const usedVars = await scanUsedVars(rootDir);

    // 3. Analyze
    const { unused, missing } = analyzeEnv(envVars, usedVars);

    // 4. Output Report
    let clean = true;

    if (unused.length > 0) {
      clean = false;
      console.log("🚫 Unused (Defined in .env but not found in code):");
      unused.forEach((v) => console.log(`  - ${v}`));
      console.log("");
    }

    if (missing.length > 0) {
      clean = false;
      console.log("❓ Missing (Used in code but not defined in .env):");
      missing.forEach((v) => console.log(`  - ${v}`));
      console.log("");
    }

    if (clean) {
      console.log("✅ Everything looks good! No unused or missing variables found.");
    }

    console.log("\nDone.\n");
  } catch (error) {
    console.error("❌ Error during scan:", error.message);
    process.exit(1);
  }
}

run();
