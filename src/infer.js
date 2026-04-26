/**
 * Infers types from process.env string values.
 * - "true"/"false" -> boolean
 * - numeric strings -> number
 * - everything else -> string
 * 
 * @returns {Object} An object with inferred values.
 */
export function inferEnv() {
  const inferred = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (value === 'true') {
      inferred[key] = true;
    } else if (value === 'false') {
      inferred[key] = false;
    } else if (value !== '' && !isNaN(Number(value)) && !isNaN(parseFloat(value))) {
      inferred[key] = Number(value);
    } else {
      inferred[key] = value;
    }
  }

  return inferred;
}
