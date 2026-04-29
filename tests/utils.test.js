import { describe, it } from "node:test";
import assert from "node:assert";
import { parseEnv } from "../src/index.js";

describe("parseEnv", () => {
  it("parses simple KEY=VALUE pairs", () => {
    const input = "PORT=3000\nDB_URL=mongodb://localhost";
    const result = parseEnv(input);
    assert.deepStrictEqual(result, { PORT: "3000", DB_URL: "mongodb://localhost" });
  });

  it("ignores comments and empty lines", () => {
    const input = "\n# This is a comment\nPORT=3000\n\n  # Another comment\nDEBUG=true";
    const result = parseEnv(input);
    assert.deepStrictEqual(result, { PORT: "3000", DEBUG: "true" });
  });

  it("trims spaces around keys and values", () => {
    const input = "  PORT  =  3000  ";
    const result = parseEnv(input);
    assert.deepStrictEqual(result, { PORT: "3000" });
  });

  it("handles double quoted values", () => {
    const input = 'API_KEY="secret-123"';
    const result = parseEnv(input);
    assert.strictEqual(result.API_KEY, "secret-123");
  });

  it("handles single quoted values", () => {
    const input = "API_KEY='secret-123'";
    const result = parseEnv(input);
    assert.strictEqual(result.API_KEY, "secret-123");
  });

  it("handles quoted keys", () => {
    const input = '"QUOTED_KEY"=value';
    const result = parseEnv(input);
    assert.strictEqual(result.QUOTED_KEY, "value");
  });

  it("handles equal signs in values", () => {
    const input = "CONNECTION_STRING=postgres://user:pass=word@host";
    const result = parseEnv(input);
    assert.strictEqual(result.CONNECTION_STRING, "postgres://user:pass=word@host");
  });
});
