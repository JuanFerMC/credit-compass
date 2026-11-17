const SENSITIVE_KEY_PATTERN =
  /^(?:authorization|access[_-]?token|refresh[_-]?token|id[_-]?token|token|password|client[_-]?secret)$/i;

const REDACTION = "[REDACTED]";

/**
 * Redacts credentials embedded in diagnostic strings before they reach logs
 * or external telemetry. Keep this deliberately conservative: ordinary
 * application messages and trace identifiers remain useful for debugging.
 */
export function redactSensitiveText(value: string): string {
  return value
    .replace(/(\bBearer\s+)[A-Za-z0-9._~+/-]+=*/gi, `$1${REDACTION}`)
    .replace(
      /((?:["']?(?:authorization|access[\s_-]?token|refresh[\s_-]?token|id[\s_-]?token|token|password|client[_-]?secret)["']?\s*[:=]\s*))(["']?)(?:Bearer\s+)?([^"'&\s,;}]+)/gi,
      `$1$2${REDACTION}`,
    )
    .replace(
      /([?&](?:access_token|refresh_token|id_token|token)=)[^&#\s]+/gi,
      `$1${REDACTION}`,
    )
    .replace(
      /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g,
      REDACTION,
    );
}

/**
 * Produces a log-safe copy of arbitrary diagnostic data without mutating the
 * original value. Sensitive object properties are redacted by key; strings
 * are also scanned for credentials that may have been embedded in messages.
 */
export function redactSensitiveData(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") return redactSensitiveText(value);
  if (value == null || typeof value !== "object") return value;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSensitiveText(value.message),
      ...(value.stack ? { stack: redactSensitiveText(value.stack) } : {}),
      ...(value.cause !== undefined ? { cause: redactSensitiveData(value.cause, seen) } : {}),
    };
  }

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? REDACTION
      : redactSensitiveData(item, seen);
  }
  return result;
}

/** Returns an Error suitable for external telemetry, without original secrets. */
export function redactError(error: unknown): Error | unknown {
  if (!(error instanceof Error)) return redactSensitiveData(error);

  const safe = new Error(redactSensitiveText(error.message));
  safe.name = error.name;
  if (error.stack) safe.stack = redactSensitiveText(error.stack);
  return safe;
}
