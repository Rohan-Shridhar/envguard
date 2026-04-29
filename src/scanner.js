import fs from "fs/promises";
import path from "path";
import { parseEnv } from "./utils.js";

/**
 * Recursively scans a directory for files matching certain extensions.
 * @param {string} dir - The directory to scan.
 * @param {string[]} extensions - Array of file extensions to include.
 * @param {string[]} ignore - Array of directory names to ignore.
 * @returns {Promise<string[]>} List of absolute file paths.
 */
async function getFiles(dir, extensions = [".js", ".mjs", ".ts", ".jsx", ".tsx"], ignore = ["node_modules", ".git", "dist", "build", "tests", "scanner.js"]) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      if (ignore.includes(dirent.name)) return [];
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
 * Scans codebase for process.env usage.
 * @param {string} rootDir - The root directory to scan.
 * @returns {Promise<Set<string>>} A set of found environment variable names.
 */
export async function scanUsedVars(rootDir) {
  const files = await getFiles(rootDir);
  const usedVars = new Set();
  
  // 1. Matches process.env.VAR or process.env?.VAR
  const dotRegex = /process\.env(?:\?\.|\.)([a-zA-Z_][a-zA-Z0-9_]*)/g;

  // 2. Matches process.env['VAR'] or process.env?.['VAR'] or process.env?.['VAR']
  const bracketRegex = /process\.env(?:\?\.)?\[['"]([a-zA-Z_][a-zA-Z0-9_]*)['"]\]/g;

  // 3. Matches const { VAR1, VAR2: alias } = process.env
  const destructureRegex = /(?:const|let|var)\s+\{\s*([^}]+)\s*\}\s*=\s*process\.env/g;

  for (const file of files) {
    try {
      const originalContent = await fs.readFile(file, "utf8");
      
      // Strip comments to avoid false positives (simple but effective for most cases)
      const content = originalContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");

      let match;

      // Scan Dot Notation
      while ((match = dotRegex.exec(content)) !== null) {
        if (match[1]) usedVars.add(match[1]);
      }

      // Scan Bracket Notation
      while ((match = bracketRegex.exec(content)) !== null) {
        if (match[1]) usedVars.add(match[1]);
      }

      // Scan Destructuring
      while ((match = destructureRegex.exec(content)) !== null) {
        const properties = match[1].split(",");
        for (let prop of properties) {
          prop = prop.trim();
          if (!prop) continue;
          
          // Handle aliases: { VAR: alias }
          const name = prop.split(":")[0].trim();
          // Avoid matching rest elements: { ...others }
          if (!name.startsWith("...")) {
            usedVars.add(name);
          }
        }
      }

    } catch (err) {
      continue;
    }
  }
  
  return usedVars;
}

/**
 * Internal helper to compare defined and used variables.
 * @param {Object} envVars 
 * @param {Set<string>} usedVars 
 * @returns {Object}
 */
export function compareEnvVars(envVars, usedVars) {
  const defined = Object.keys(envVars);
  const unused = defined.filter((v) => !usedVars.has(v));
  const missing = Array.from(usedVars).filter((v) => !defined.includes(v));
  
  return { unused, missing };
}

/**
 * Orchestrates the full .env/codebase analysis and prints a report.
 * @param {Object} options
 * @param {string} [options.envPath=".env"] - Path to the .env file.
 * @param {string} [options.rootDir=process.cwd()] - Root directory of the codebase.
 */
export async function analyzeEnv({ envPath = ".env", rootDir = process.cwd() } = {}) {
  try {
    // 1. Parse .env
    const absEnvPath = path.resolve(process.cwd(), envPath);
    let envContent = "";
    try {
      envContent = await fs.readFile(absEnvPath, "utf8");
    } catch (err) {
      // Treat as empty if file is missing
    }
    const envVars = parseEnv(envContent);

    // 2. Scan codebase
    const usedVars = await scanUsedVars(path.resolve(process.cwd(), rootDir));

    // 3. Compare
    const { unused, missing } = compareEnvVars(envVars, usedVars);

    // 4. Print report
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
