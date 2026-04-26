# envguard

A zero-boilerplate environment variable validator for Node.js.

Call it once at app startup — it checks all your env vars, coerces types, and throws a clear error if anything is missing or wrong. No more runtime crashes from undefined env vars.

---

## Install

```bash
npm install envguard
```

---

## Usage

```js
import 'dotenv/config'
import { guard } from 'envguard'

const env = guard({
  PORT:         { type: 'number',  default: 3000 },
  DATABASE_URL: { type: 'string',  required: true },
  DEBUG:        { type: 'boolean', default: false },
  JWT_SECRET:   { type: 'string',  required: true, minLength: 32 }
})

app.listen(env.PORT)
mongoose.connect(env.DATABASE_URL)
```

---

## Zero-config mode

For rapid development or scripts where you don't want to maintain a schema, use `inferEnv()`. It automatically detects types from your environment variables.

```js
import { inferEnv } from 'envguard'

const env = inferEnv()

// Automatically detects:
// "3000"  → 3000 (number)
// "true"  → true (boolean)
// "hello" → "hello" (string)
```

### When to use it
- **Prototyping**: Get type coercion without writing a schema.
- **Small Scripts**: When you have many variables and just want them to "just work".
- **Strict Inference**: Use `strict: true` to catch botched environment variables.

### inferEnv() vs guard()

| Feature | `inferEnv()` | `guard()` |
|---|---|---|
| **Setup** | Zero boilerplate | Requires schema |
| **Validation** | Inference based | Strict requirement checks |
| **Required Vars** | No checks | Throws if missing |
| **Use Case** | Quick & easy | Production-grade safety |

### Strict mode & Overrides
You can enable `strict` mode to throw errors on ambiguous strings (like `"123abc"`) and provide overrides for specific keys.

```js
const env = inferEnv({
  strict: true,
  PORT: { type: 'number' } // Enforce type for specific keys
})
```

---

## What it does

- Checks all required vars are present
- Coerces types — `"3000"` → `3000`, `"true"` → `true`
- Validates `minLength` for sensitive strings like secrets and keys
- Uses `default` values when a var isn't set
- Throws **one combined error** at startup listing everything that's wrong

---

## Error output

If something is missing or invalid, you get a clear message instead of a cryptic runtime crash:

```
[envguard] Missing or invalid environment variables:
  ✗ DATABASE_URL → required but not set
  ✗ JWT_SECRET   → must be at least 32 characters (got 8)
  ✗ PORT         → expected number, got "abc"

Fix these before starting the server.
```

---

## Schema options

| Option | Type | Description |
|---|---|---|
| `type` | `'string'` `'number'` `'boolean'` | Expected type. String is returned as-is, others are coerced. |
| `required` | `boolean` | Throws if the var is not set. |
| `default` | any | Fallback value if the var is not set. |
| `minLength` | `number` | Minimum character length. Useful for secrets and API keys. |

---

## Notes

- `envguard` does **not** load your `.env` file. Use [dotenv](https://www.npmjs.com/package/dotenv) for that.
- Call `guard()` at the **top of your entry file**, before anything else runs.
- `required` and `default` can't both be set on the same field — if it's required, there's no fallback.

---

## License

MIT