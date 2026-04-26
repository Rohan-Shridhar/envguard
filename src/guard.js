/**
 * Coerces a value based on the specified type.
 * @param {string} value 
 * @param {string} type 
 * @returns {*}
 * @throws {Error} If coercion fails
 */
export function coerce(value, type) {
  if (type === "number") {
    const num = Number(value);
    if (isNaN(num)) throw new Error("expected number");
    return num;
  } else if (type === "boolean") {
    if (value !== "true" && value !== "false") {
      throw new Error("expected boolean (true/false)");
    }
    return value === "true";
  }
  return value;
}

/**
 * Validates and coerces environment variables based on the schema.
 * @param {Object} schema 
 * @returns {Object}
 */
export function guard(schema) {
  const errors = [];
  const result = {};

  for (const key in schema) {
    const rule = schema[key];
    const raw = process.env[key];

    // 1. check required
    if (rule.required && !raw) {
      errors.push(`  ✗ ${key} → required but not set`);
      continue;
    }

    // 2. use default if not set
    if (!raw && rule.default !== undefined) {
      result[key] = rule.default;
      continue;
    }

    // 3. coerce type
    if (raw) {
      try {
        result[key] = coerce(raw, rule.type);
      } catch (e) {
        errors.push(`  ✗ ${key} → ${e.message}, got "${raw}"`);
        continue;
      }

      // 4. minLength check (strings only)
      if (rule.minLength && result[key].length < rule.minLength) {
        errors.push(
          `  ✗ ${key} → must be at least ${rule.minLength} characters (got ${result[key].length})`,
        );
        delete result[key];
      }
    }
  }

  // 5. throw all errors at once
  if (errors.length > 0) {
    throw new Error(
      `\n[envguard] Missing or invalid environment variables:\n${errors.join("\n")}\n\nFix these before starting the server.`,
    );
  }

  return result;
}
