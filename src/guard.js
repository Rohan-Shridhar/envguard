import { coerce } from "./utils.js";

/**
 * Validates and coerces environment variables based on the schema.
 * @param {Object} schema 
 * @returns {Object}
 */
export function guard(schema, options = {}) {
 const errors = [];
 const result = {};

 for (const key in schema) {
 const rule = schema[key];
 const raw = process.env[key];

 // 1. check required
 if (rule.required && !raw) {
 errors.push(` ✗ ${key} → required but not set`);
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
 errors.push(` ✗ ${key} → ${e.message}, got "${raw}"`);
 continue;
 }

 // 4. minLength check (strings only)
 // Only apply minLength validation to string types to avoid silent failures
 if (rule.minLength && rule.type === 'string' && result[key].length < rule.minLength) {
 errors.push(
 ` ✗ ${key} → must be at least ${rule.minLength} characters (got ${result[key].length})`,
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

 return new Proxy(result, {
 get(target, prop) {
 if (typeof prop === 'symbol') {
 return target[prop];
 }
 
 if (prop === 'toJSON' || prop === 'then' || prop === '__esModule') {
 return target[prop];
 }

 if (prop in Object.prototype) {
 return target[prop];
 }

 if (prop === 'has' && !('has' in schema)) {
 return (key) => target[key] !== undefined;
 }

 const isUnvalidated = !(prop in schema);

 if (options.strict && isUnvalidated) {
 throw new Error(`[envguard] Attempted to access undefined environment variable: ${String(prop)}`);
 }

 const isMissing = target[prop] === undefined;

 if (isMissing && (!isUnvalidated || options.strict)) {
 throw new Error(`[envguard] Attempted to access undefined environment variable: ${String(prop)}`);
 }

 return target[prop];
 }
 });
}
