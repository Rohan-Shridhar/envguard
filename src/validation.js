/**
 * Unified validation pipeline for both guard() and inferEnv()
 * Consolidates type coercion, defaults, required, and validation
 */

import { coerce, inferType, validateValue } from "./types.js";

/**
 * Validates environment variables against a schema
 * Returns { result, errors } where result is the validated values
 * and errors is an array of error messages
 */
export function validateSchema(schema, envVars, options = {}) {
  const { strict = false, inferOnly = false } = options;
  const result = {};
  const errors = [];

  for (const key in schema) {
    const rule = schema[key];
    const rawValue = envVars[key];

    // Check for conflicting rules
    if (rule.required && rule.default !== undefined) {
      errors.push(`✗ ${key} → cannot have both required and default`);
      continue;
    }

    // Check if required
    if (rule.required && !rawValue) {
      errors.push(`✗ ${key} → required but not set`);
      continue;
    }

    // Use default if not set
    if (!rawValue && rule.default !== undefined) {
      const validated = validateValue(key, rule.default, rule);
      if (validated.length > 0) {
        errors.push(...validated);
      } else {
        result[key] = rule.default;
      }
      continue;
    }

    // Skip if no value and no default
    if (!rawValue) {
      continue;
    }

    // Coerce or infer type
    try {
      const coercedValue = inferOnly 
        ? inferType(rawValue)
        : coerce(rawValue, rule.type);

      const validated = validateValue(key, coercedValue, rule);
      if (validated.length > 0) {
        errors.push(...validated);
      } else {
        result[key] = coercedValue;
      }
    } catch (e) {
      errors.push(`✗ ${key} → ${e.message}, got "${rawValue}"`);
    }
  }

  return { result, errors };
}

/**
 * Validates environment variables with strict mode for inference
 * Used by inferEnv() when strict=true
 */
export function validateInferenceStrict(schema, envVars) {
  const errors = [];

  for (const [key, value] of Object.entries(envVars)) {
    const rule = schema[key];
    if (!rule) continue;

    const lower = value.toLowerCase();
    if (lower === "true" || lower === "false") {
      if (value !== "true" && value !== "false") {
        errors.push(
          `✗ ${key} → ambiguous boolean: expected exact "true" or "false", got "${value}"`
        );
      }
    } else if (!isNaN(parseFloat(value))) {
      // Check if it's not a valid numeric string
      if (isNaN(Number(value)) || value === "") {
        errors.push(
          `✗ ${key} → invalid numeric string: contains non-numeric characters, got "${value}"`
        );
      }
    }
  }

  return errors;
}
