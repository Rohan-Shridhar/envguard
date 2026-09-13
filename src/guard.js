import { validateSchema } from "./validation.js";

/**
 * Validates and coerces environment variables based on the schema.
 * Uses the unified validation pipeline for consistent handling.
 * @param {Object} schema - Schema definition for environment variables
 * @param {Object} options - Options (e.g., strict mode)
 * @returns {Proxy} Validated environment variables with safe access
 */
export function guard(schema, options = {}) {
  const { result, errors } = validateSchema(schema, process.env);

  if (errors.length > 0) {
    throw new Error(
      `\n[envguard] Missing or invalid environment variables:\n${errors.join("\n")}\n\nFix these before starting the server.`
    );
  }

  return new Proxy(result, {
    get(target, prop) {
      if (typeof prop === "symbol") {
        return target[prop];
      }

      if (prop === "toJSON" || prop === "then" || prop === "__esModule") {
        return target[prop];
      }

      if (prop in Object.prototype) {
        return target[prop];
      }

      if (prop === "has" && !("has" in schema)) {
        return (key) => target[key] !== undefined;
      }

      const isUnvalidated = !(prop in schema);

      if (options.strict && isUnvalidated) {
        throw new Error(
          `[envguard] Attempted to access undefined environment variable: ${String(prop)}`
        );
      }

      const isMissing = target[prop] === undefined;

      if (isMissing && (!isUnvalidated || options.strict)) {
        throw new Error(
          `[envguard] Attempted to access undefined environment variable: ${String(prop)}`
        );
      }

      return target[prop];
    }
  });
}
