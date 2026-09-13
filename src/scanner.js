import fs from "fs/promises";
import path from "path";
import { parseEnv } from "./utils.js";

/**
 * Recursively scans a directory for files matching certain extensions.
 * Skips node_modules, .git, dist, build, tests, and scanner.js
 */
async function getFiles(
  dir,
  extensions = [".js", ".mjs", ".ts", ".jsx", ".tsx"],
  ignore = ["node_modules", ".git", "dist", "build", "tests", "scanner.js"]
) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      if (ignore.includes(dirent.name)) return [];
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory()
        ? getFiles(res, extensions, ignore)
        : extensions.includes(path.extname(res))
        ? res
        : [];
    })
  );
  return files.flat();
}

/**
 * Extracts environment variable names from code using regex patterns
 * Handles: process.env.VAR, process.env['VAR'], destructuring
 */
function extractVarsFromContent(content) {
  const usedVars = new Set();

  // Strip comments to avoid false positives
  const clean = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");

  // Match: process.env.VAR or process.env?.VAR
  const dotRegex = /process\.env(?:\?\.|\.)([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;
  while ((match = dotRegex.exec(clean)) !== null) {
    if (match[1]) usedVars.add(match[1]);
  }

  // Match: process.env['VAR'] or process.env?.['VAR']
  const bracketRegex = /process\.env(?:\?\.)?\[['"]([a-zA-Z_][a-zA-Z0-9_]*)['"]\]/g;
  while ((match = bracketRegex.exec(clean)) !== null) {
    if (match[1]) usedVars.add(match[1]);
  }

  // Match: const { VAR1, VAR2: alias } = process.env
  const destructureRegex = /(?:const|let|var)\s+\{\s*([^}]+)\s*\}\s*=\s*process\.env/g;
  while ((match = destructureRegex.exec(clean)) !== null) {
    const properties = match[1].split(",");
    for (let prop of properties) {
      prop = prop.trim();
      if (prop && !prop.startsWith("...")) {
        const name = prop.split(":")[0].trim();
        usedVars.add(name);
      }
    }
  }

  return usedVars;
}

/**
 * Scans codebase for process.env usage
 * @returns {Promise<Set<string>>} Set of environment variable names found
 */
export async function scanUsedVars(rootDir) {
  const files = await getFiles(rootDir);
  const usedVars = new Set();

  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf8");
      const vars = extractVarsFromContent(content);
      vars.forEach((v) => usedVars.add(v));
    } catch (err) {
      // Skip files that can't be read
      continue;
    }
  }

  return usedVars;
}

/**
 * Compares defined vars (from .env) with used vars (from code scan)
 */
export function compareEnvVars(envVars, usedVars) {
  const defined = Object.keys(envVars);
  const unused = defined.filter((v) => !usedVars.has(v));
  const missing = Array.from(usedVars).filter((v) => !defined.includes(v));
  return { unused, missing };
}

/**
 * Orchestrates the full .env/codebase analysis and prints a report
 */
export async function analyzeEnv({ envPath = ".env", rootDir = process.cwd() } = {}) {
  try {
    // Parse .env file
    const absEnvPath = path.resolve(process.cwd(), envPath);
    let envContent = "";
    try {
      envContent = await fs.readFile(absEnvPath, "utf8");
    } catch (err) {
      // Treat as empty if file is missing
    }
    const envVars = parseEnv(envContent);

    // Scan codebase
    const usedVars = await scanUsedVars(path.resolve(process.cwd(), rootDir));

    // Compare
    const { unused, missing } = compareEnvVars(envVars, usedVars);

    // Print report
    console.log("\n[envguard] Environment Variable Report:");

    if (unused.length === 0 && missing.length === 0) {
      console.log("\n  ✓ All environment variables are in sync\n");
      return { unused, missing };
    }

    if (unused.length > 0) {
      console.log("\nUnused variables (.env but not used):");
      unused.forEach((v) => console.log(`  - ${v}`));
    }

    if (missing.length > 0) {
      console.log("\nMissing variables (used in code but not in .env):");
      missing.forEach((v) => console.log(`  - ${v}`));
    }

    console.log("");
    return { unused, missing };
  } catch (error) {
    console.error("\n[envguard] Error during analysis:", error.message);
    throw error;
  }
}
