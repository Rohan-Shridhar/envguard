import http from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { parseEnv } from "./utils.js";
import { scanUsedVars, compareEnvVars } from "./scanner.js";
import { inferType } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Starts a local HTTP server for the Dev UI with real-time data polling
 */
export async function startDevServer(port = 3000) {
  const server = http.createServer(async (req, res) => {
    // API endpoint for environment variable data
    if (req.url === "/api/env") {
      try {
        const rootDir = process.cwd();
        const envPath = path.join(rootDir, ".env");

        let envContent = "";
        try {
          envContent = await fs.readFile(envPath, "utf8");
        } catch (e) {
          // .env file not found, treat as empty
        }

        const envVars = parseEnv(envContent);
        const usedVarsArray = await scanUsedVars(rootDir);
        const usedVars = new Set(usedVarsArray);
        const { unused, missing } = compareEnvVars(envVars, usedVars);

        const defined = Object.keys(envVars);
        const used = defined.filter((v) => usedVars.has(v));
        const invalid = defined.filter((key) => {
          const val = envVars[key];
          return val === "" || val === "null" || val === "undefined";
        });

        // Load schema if available
        let schema = {};
        try {
          const schemaPath = path.join(rootDir, "env.schema.js");
          const schemaModule = await import(`file://${schemaPath}`);
          schema = schemaModule.default || schemaModule;
        } catch (e) {
          // No schema found or failed to load
        }

        // Compute type mismatches against schema
        const typeMismatches = [];
        for (const key in schema) {
          const rule = schema[key];
          const rawValue = envVars[key];

          if (rawValue !== undefined && rule.type) {
            const inferred = inferType(rawValue);
            const actualType = typeof inferred;

            if (actualType !== rule.type) {
              typeMismatches.push({
                key,
                expected: rule.type,
                actual: actualType
              });
            }
          }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          total: defined.length,
          unused,
          missing,
          used,
          invalid,
          typeMismatches
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // Serve dashboard UI
    if (req.url === "/") {
      try {
        const html = await fs.readFile(path.join(__dirname, "dashboard/index.html"), "utf8");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
      } catch (err) {
        res.writeHead(404);
        res.end("Not Found");
      }
      return;
    }

    // 404
    res.writeHead(404);
    res.end();
  });

  server.listen(port, () => {
    console.log(`\n🚀 [envguard] Dev UI running at http://localhost:${port}`);
    console.log("Press Ctrl+C to stop.\n");
  });
}
