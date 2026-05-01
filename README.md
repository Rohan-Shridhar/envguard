# envguard

[![npm version](https://img.shields.io/npm/v/@rohansm14/envguard)](https://www.npmjs.com/package/@rohansm14/envguard)
[![npm downloads](https://img.shields.io/npm/dm/@rohansm14/envguard)](https://www.npmjs.com/package/@rohansm14/envguard)

A zero-boilerplate environment variable validator and analysis tool for Node.js.

🛡️ **Validate**: Coerce types and enforce schemas at startup.  
🔍 **Analyze**: Detect unused or missing variables in your codebase.  
📊 **Dashboard**: Visualize your environment health in a local dev UI.

---

## Install

```bash
npm install @rohansm14/envguard
```

---

## Preview

### CLI Scan (`npx envguard`)
```bash
[envguard] Environment Variable Report:

Unused variables (.env but not used):
  - OLD_API_KEY
  - LEGACY_DB

Missing variables (used in code but not in .env):
  - STRIPE_SECRET
  - REDIS_URL
```

### Dev Dashboard (`npx envguard dev-ui`)
Starts a local server at http://localhost:3000 showing:
- Total, Unused, Missing, Invalid counts
- Type mismatch conflicts from env.schema.js  
- Color-coded variable lists (✓ linked, ⚠ unused, ✗ missing)

---

## ⚡ Quick Start

### 1. Validate & Coerce
Call it at app startup to ensure your environment is safe.

```js
import 'dotenv/config'
import { guard } from '@rohansm14/envguard'

const env = guard({
  PORT:         { type: 'number',  default: 3000 },
  DATABASE_URL: { type: 'string',  required: true },
  JWT_SECRET:   { type: 'string',  required: true, minLength: 32 }
})

app.listen(env.PORT)
```

### 2. Infer Types (Zero-schema)
Don't want to maintain a schema? `inferEnv()` automatically detects types.

```js
import { inferEnv } from '@rohansm14/envguard'
const env = inferEnv()

// "3000"  → 3000 (number)
// "true"  → true (boolean)
```

---

## 🔍 Codebase Analysis (CLI)

`envguard` scans your entire project to find discrepancies between your `.env` file and your code usage.

```bash
npx envguard
```

**It identifies:**
- **Unused**: Variables defined in `.env` but never used in code.
- **Missing**: `process.env.VAR` calls in code that aren't defined in `.env`.
- **Invalid**: Variables set to `null`, `undefined`, or empty strings.

---

## 📊 Dev Dashboard (UI)

Launch a local dashboard to visualize your environment health in real-time.

```bash
npx envguard dev-ui
```

Starts a server at `http://localhost:3000` with:
- **Real-time Polling**: Updates automatically as you edit files.
- **Type Mismatches**: Flagged conflicts between your values and an optional `env.schema.js`.
- **Status Badges**: Clear `✓`, `⚠`, and `✗` indicators for every variable.

### ⚠️ Important: How to View the Dashboard
The dashboard is a **web application** that requires the `envguard` local server to be running.
*   **Do NOT open `index.html` directly** from your browser (using `File > Open` or double-clicking).
*   If you open the file directly, it will show **empty stats** because it won't be able to connect to the backend scanner.
*   **Always use the command:** `npx envguard dev-ui` and navigate to `http://localhost:3000`.

### Requirements
- **Project Root**: Run the command from your project's root directory.
- **`.env` file**: Must have a `.env` file present for comparison.
- **Code Usage**: Must have at least one `process.env.VAR` usage in your code for the scanner to detect.

---

## What it does

- **Deep Scanning**: Detects dot notation (`process.env.VAR`), bracket notation (`process.env['VAR']`), and **destructuring** (`const { VAR } = process.env`).
- **Robust Parsing**: Correctly handles comments, quotes, and optional chaining (`process.env?.VAR`).
- **One Combined Error**: Logs all validation failures at once so you can fix them in one go.
- **Zero Dependencies**: Lightweight and fast, built on native Node.js logic.

---

## Schema Options

| Option | Type | Description |
|---|---|---|
| `type` | `'string'` `'number'` `'boolean'` | Expected type. Others are coerced. |
| `required` | `boolean` | Throws if the var is not set. |
| `default` | any | Fallback value if the var is not set. |
| `minLength` | `number` | Minimum character length for strings. |

---

## License

MIT
