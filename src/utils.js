/**
 * Parses a .env file content into a JavaScript object
 * Handles quoted values and comments
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

