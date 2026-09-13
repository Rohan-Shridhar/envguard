/**
 * Unified type utilities - single source of truth for all type operations
 */

/**
 * Checks if a string represents a boolean value
 */
export function isBoolean(value) {
  return value === "true" || value === "false" || value === "1" || value === "0";
}

/**
 * Checks if a string represents a numeric value
 */
export function isNumeric(value) {
  return value !== "" && !isNaN(Number(value)) && !isNaN(parseFloat(value));
}

/**
 * Coerces a string value to the specified type
 * @throws {Error} if coercion fails
 */
export function coerce(value, type) {
  if (type === "number") {
    const num = Number(value);
    if (isNaN(num)) throw new Error("expected number");
    return num;
  }
  
  if (type === "boolean") {
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    throw new Error("expected boolean (true/false)");
  }
  
  return value;
}

/**
 * Infers the native type of a string value
 * Returns the coerced value (string, number, or boolean)
 */
export function inferType(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (isNumeric(value)) return Number(value);
  return value;
}

/**
 * Validates a coerced value against a schema rule
 * @returns {Array<string>} array of error messages (empty = valid)
 */
export function validateValue(key, value, rule) {
  const errors = [];

  // Check minLength for strings
  if (rule.minLength && typeof value === "string" && value.length < rule.minLength) {
    errors.push(
      `✗ ${key} → must be at least ${rule.minLength} characters (got ${value.length})`
    );
  }

  return errors;
}
