import { validateSchema, validateInferenceStrict } from "./validation.js";

/**
 * Infers types from process.env string values, with optional overrides and strict mode.
 * Uses the unified validation pipeline.
 * @param {Object} config - Config with optional overrides and strict flag
 * @param {Object} env - Environment variables (defaults to process.env)
 * @returns {Object} Inferred values with native types
 */
export function inferEnv(config = {}, env = process.env) {
  const { strict = false, ...schema } = config;

  // Validate inference with strict mode if enabled
  if (strict) {
    const errors = validateInferenceStrict(schema, env);
    if (errors.length > 0) {
      throw new Error(
        `\n[envguard] Strict inference failed:\n${errors.join("\n")}\n\nReview your environment variables.`
      );
    }
  }

  // Use validation pipeline with inference mode
  const { result, errors } = validateSchema(schema, env, { inferOnly: true });

  if (errors.length > 0) {
    throw new Error(
      `\n[envguard] Strict inference failed:\n${errors.join("\n")}\n\nReview your environment variables.`
    );
  }

  return result;
}
