import { coerce } from "./guard.js";

/**
 * Infers the type of a string value.
 * @param {string} value 
 * @returns {string|number|boolean}
 */
export function inferType(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Check if strictly a numeric string
  if (value !== '' && !isNaN(Number(value)) && !isNaN(parseFloat(value))) {
    return Number(value);
  }

  return value;
}

/**
 * Infers types from process.env string values, with optional overrides.
 * @param {Object} [overrides={}] 
 * @returns {Object} An object with inferred values.
 */
export function inferEnv(overrides = {}) {
  const inferred = {};

  for (const [key, value] of Object.entries(process.env)) {
    const override = overrides[key];

    if (override) {
      try {
        inferred[key] = coerce(value, override.type);
      } catch (e) {
        throw new Error(`[envguard] Override failed for ${key}: ${e.message}, got "${value}"`);
      }
    } else {
      inferred[key] = inferType(value);
    }
  }

  return inferred;
}
