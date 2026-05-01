import { coerce } from "./utils.js";

export function guard(schema, options = {}) {
  const { strict = false } = options;
  const errors = [];
  const result = {};

  for (const key in schema) {
    const rule = schema[key];
    const raw = process.env[key];

    // 1. required check (correct)
    if (rule.required && raw === undefined) {
      errors.push(`  ✗ ${key} → required but not set`);
      continue;
    }

    // 2. default
    if (raw === undefined && rule.default !== undefined) {
      result[key] = rule.default;
      continue;
    }

    // 3. coerce
    if (raw !== undefined) {
      try {
        result[key] = coerce(raw, rule.type);
      } catch (e) {
        errors.push(`  ✗ ${key} → ${e.message}, got "${raw}"`);
        continue;
      }

      // 4. minLength (safe)
      if (
        rule.minLength &&
        typeof result[key] === "string" &&
        result[key].length < rule.minLength
      ) {
        errors.push(
          `  ✗ ${key} → must be at least ${rule.minLength} characters (got ${result[key].length})`
        );
        delete result[key];
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `\n[envguard] Missing or invalid environment variables:\n${errors.join("\n")}\n\nFix these before starting the server.`
    );
  }

  // ✅ CLEAN PROXY
  return new Proxy(result, {
    get(target, prop) {
      if (typeof prop === "symbol") return target[prop];

      const key = String(prop);

      // helper method
      if (key === "has") {
        return (k) => Object.prototype.hasOwnProperty.call(target, k);
      }

      const inSchema = key in schema;
      const inResult = Object.prototype.hasOwnProperty.call(target, key);

      // strict → only schema keys allowed
      if (strict && !inSchema) {
        throw new Error(
          `[envguard] Attempted to access undefined environment variable: ${key}`
        );
      }

      // accessing missing validated key
      if (inSchema && !inResult) {
        throw new Error(
          `[envguard] Attempted to access undefined environment variable: ${key}`
        );
      }

      return target[key];
    }
  });
}