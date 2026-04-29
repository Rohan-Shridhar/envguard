import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { compareEnvVars, scanUsedVars } from "../src/index.js";

describe("compareEnvVars", () => {
  it("identifies unused and missing variables", () => {
    const envVars = { PORT: "3000", UNUSED: "val" };
    const usedVars = new Set(["PORT", "MISSING"]);
    
    const { unused, missing } = compareEnvVars(envVars, usedVars);
    
    assert.deepStrictEqual(unused, ["UNUSED"]);
    assert.deepStrictEqual(missing, ["MISSING"]);
  });

  it("returns empty arrays when in sync", () => {
    const envVars = { PORT: "3000" };
    const usedVars = new Set(["PORT"]);
    
    const { unused, missing } = compareEnvVars(envVars, usedVars);
    
    assert.deepStrictEqual(unused, []);
    assert.deepStrictEqual(missing, []);
  });
});

describe("scanUsedVars", () => {
  // We use a temporary directory to test the scanner in a controlled environment
  let tempDir;

  async function createTestFile(filePath, content) {
    const fullPath = path.join(tempDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  it("detects various usage patterns in source files", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "envguard-test-"));

    try {
      await createTestFile("app.js", `
        const port = process.env.PORT;
        const api = process.env['API_KEY'];
        // process.env.COMMENTED_OUT
        /* 
           process.env.BLOCK_COMMENTED 
        */
      `);

      await createTestFile("src/utils.ts", `
        export const { HOST, DB_URL: db } = process.env;
        const debug = process.env?.DEBUG;
      `);

      // Should ignore node_modules
      await createTestFile("node_modules/dep/index.js", "process.env.INTERNAL = 'X'");

      const usedVars = await scanUsedVars(tempDir);

      assert.ok(usedVars.has("PORT"));
      assert.ok(usedVars.has("API_KEY"));
      assert.ok(usedVars.has("HOST"));
      assert.ok(usedVars.has("DB_URL"));
      assert.ok(usedVars.has("DEBUG"));
      
      // Should NOT have ignored ones
      assert.strictEqual(usedVars.has("COMMENTED_OUT"), false);
      assert.strictEqual(usedVars.has("BLOCK_COMMENTED"), false);
      assert.strictEqual(usedVars.has("INTERNAL"), false);

    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
