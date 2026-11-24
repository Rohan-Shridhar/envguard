import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../bin/envguard.js", import.meta.url));

describe("CLI help", () => {
  for (const flag of ["--help", "-h"]) {
    it(`prints usage and skips the scan for ${flag}`, (t) => {
      const cwd = mkdtempSync(join(tmpdir(), "envguard-cli-"));
      t.after(() => rmSync(cwd, { recursive: true, force: true }));
      writeFileSync(join(cwd, ".env"), "DEMO_UNUSED=hello\n");
      writeFileSync(join(cwd, "example.js"), "process.env.DEMO_MISSING;\n");

      const result = spawnSync(process.execPath, [cliPath, flag], {
        cwd,
        env: {},
        encoding: "utf8",
        timeout: 5000,
      });

      assert.ifError(result.error);
      assert.equal(result.status, 0);
      assert.equal(result.stderr, "");
      assert.match(result.stdout, /^Usage:/);
      assert.match(result.stdout, /^  envguard +Scan/m);
      assert.match(result.stdout, /^  envguard dev-ui +Start/m);
      assert.match(result.stdout, /--help/);
      assert.match(result.stdout, /-h\b/);
      assert.doesNotMatch(result.stdout, /Environment Variable Report|DEMO_UNUSED|DEMO_MISSING/);
    });
  }
});
