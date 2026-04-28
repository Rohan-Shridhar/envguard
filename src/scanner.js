import fs from "fs/promises";
import path from "path";

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
  
  // Matches process.env.VAR or process.env['VAR'] or process.env["VAR"]
  const regex = /process\.env\.([a-zA-Z_][a-zA-Z0-9_]*)|process\.env\[['"]([a-zA-Z_][a-zA-Z0-9_]*)['"]\]/g;

  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf8");
      let match;
      while ((match = regex.exec(content)) !== null) {
        const varName = match[1] || match[2];
        if (varName) usedVars.add(varName);
      }
    } catch (err) {
      // Skip files that can't be read
      continue;
    }
  }
  
  return usedVars;
}

/**
 * Analyzes the difference between defined and used variables.
 * @param {Object} envVars - Object containing defined env variables.
 * @param {Set<string>} usedVars - Set of variables used in code.
 * @returns {Object} Unused and missing variables.
 */
export function analyzeEnv(envVars, usedVars) {
  const defined = Object.keys(envVars);
  const unused = defined.filter((v) => !usedVars.has(v));
  const missing = Array.from(usedVars).filter((v) => !defined.includes(v));
  
  return { unused, missing };
}
