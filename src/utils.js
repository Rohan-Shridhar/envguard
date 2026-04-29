/**
 * Checks if a string value represents a boolean.
 * @param {string} value 
 * @returns {boolean}
 */
export function isBoolean(value) {
  return value === "true" || value === "false";
}

/**
 * Checks if a string value represents a number.
 * @param {string} value 
 * @returns {boolean}
 */
export function isNumeric(value) {
  return value !== "" && !isNaN(Number(value)) && !isNaN(parseFloat(value));
}

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
    if (!isBoolean(value)) {
      throw new Error("expected boolean (true/false)");
    }
    return value === "true";
  }
  return value;
}

/**
 * Infers the type of a string value.
 * @param {string} value 
 * @returns {string|number|boolean}
 */
export function inferType(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (isNumeric(value)) return Number(value);
  return value;
}

/**
 * Parses a .env file content into a JS object.
 * @param {string} content - The raw content of the .env file.
 * @returns {Object} Key-value pairs of environment variables.
 */
export function parseEnv(content) {
  const env = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Ignore empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const firstEqualIndex = trimmedLine.indexOf("=");
    if (firstEqualIndex === -1) continue;

    let key = trimmedLine.substring(0, firstEqualIndex).trim();
    let value = trimmedLine.substring(firstEqualIndex + 1).trim();

    // Handle optional quotes around keys
    if (
      (key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'"))
    ) {
      key = key.substring(1, key.length - 1);
    }

    // Handle optional quotes around values
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.substring(1, value.length - 1);
    }

    if (key) {
      env[key] = value;
    }
  }

  return env;
}
