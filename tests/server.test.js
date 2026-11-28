import { describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startDevServer } from "../src/server.js";

function request(port, urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: "127.0.0.1", port, path: urlPath }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    req.setTimeout(5000, () => req.destroy(new Error("request timed out")));
  });
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

describe("GET /api/env", () => {
  it("reports unused, missing, used and invalid variables from the current project", async () => {
    const originalCwd = process.cwd();
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "envguard-server-"));
    let server;

    try {
      await fs.writeFile(path.join(dir, ".env"), "PORT=3000\nUNUSED=x\nEMPTY=\n");
      await fs.writeFile(
        path.join(dir, "app.js"),
        "const port = process.env.PORT;\nconst missing = process.env.MISSING_VAR;\n"
      );

      process.chdir(dir);
      server = await startDevServer(0);

      const { status, headers, body } = await request(server.address().port, "/api/env");

      assert.equal(status, 200);
      assert.match(headers["content-type"], /^application\/json/);

      const data = JSON.parse(body);
      assert.equal(data.total, 3);
      for (const key of ["unused", "missing", "used", "invalid", "typeMismatches"]) {
        assert.ok(Array.isArray(data[key]), `${key} should be an array`);
      }

      assert.deepEqual(data.used, ["PORT"]);
      assert.ok(data.unused.includes("UNUSED"));
      assert.deepEqual(data.missing, ["MISSING_VAR"]);
      assert.deepEqual(data.invalid, ["EMPTY"]);
      assert.deepEqual(data.typeMismatches, []);
    } finally {
      if (server) await closeServer(server);
      process.chdir(originalCwd);
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
