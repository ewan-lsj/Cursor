/**
 * Deterministic secret-detection patterns used by the beforeSubmitPrompt hook.
 *
 * Patterns are derived from public formats published by the providers
 * themselves (AWS, GitHub, Stripe, Sentry, OpenAI, Anthropic, Slack, Google,
 * RFC 7519 JWT, PEM private keys, npm). They are intentionally precise —
 * unlike entropy heuristics, exact-format matches keep false-positive noise
 * out of the agent loop.
 *
 * Add new categories by appending an object with the same shape. Every regex
 * MUST be global (`g` flag) so the scanner can enumerate all occurrences.
 */

export const PATTERNS = Object.freeze([
  {
    id: "aws_access_key_id",
    label: "AWS access key ID",
    regex: /\b(?:AKIA|ABIA|ACCA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    id: "aws_secret_access_key",
    label: "AWS secret access key",
    regex: /\b(?:aws[_-]?secret[_-]?access[_-]?key|aws[_-]?secret)\b\s*[:=]\s*["']?([A-Za-z0-9/+]{40})["']?/gi,
  },
  {
    id: "github_personal_access_token",
    label: "GitHub personal access token",
    regex: /\bghp_[A-Za-z0-9]{36}\b/g,
  },
  {
    id: "github_oauth_token",
    label: "GitHub OAuth token",
    regex: /\bgho_[A-Za-z0-9]{36}\b/g,
  },
  {
    id: "github_app_token",
    label: "GitHub app/server/refresh token",
    regex: /\b(?:ghu_|ghs_|ghr_)[A-Za-z0-9]{36}\b/g,
  },
  {
    id: "github_fine_grained_pat",
    label: "GitHub fine-grained PAT",
    regex: /\bgithub_pat_[A-Za-z0-9_]{82}\b/g,
  },
  {
    id: "sentry_dsn",
    label: "Sentry DSN (contains the project public/secret key)",
    regex: /\bhttps?:\/\/[a-f0-9]{32,}(?::[a-f0-9]{32,})?@[A-Za-z0-9.-]+\.ingest(?:\.[a-z]+)?\.sentry\.io\/\d+/g,
  },
  {
    id: "sentry_auth_token",
    label: "Sentry user/internal auth token",
    regex: /\bsntr(?:ys|yu)_[A-Za-z0-9_-]{40,}\b/g,
  },
  {
    id: "stripe_secret_key",
    label: "Stripe secret/restricted key",
    regex: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{24,}\b/g,
  },
  {
    id: "stripe_live_publishable_key",
    label: "Stripe live publishable key",
    regex: /\bpk_live_[A-Za-z0-9]{24,}\b/g,
  },
  {
    id: "slack_token",
    label: "Slack token",
    regex: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    id: "slack_webhook",
    label: "Slack incoming webhook URL",
    regex: /\bhttps:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9]+\/B[A-Za-z0-9]+\/[A-Za-z0-9]+\b/g,
  },
  {
    id: "google_api_key",
    label: "Google API key",
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    id: "openai_api_key",
    label: "OpenAI API key",
    regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}\b/g,
  },
  {
    id: "anthropic_api_key",
    label: "Anthropic API key",
    regex: /\bsk-ant-(?:api03-)?[A-Za-z0-9_-]{40,}\b/g,
  },
  {
    id: "npm_token",
    label: "npm publish token",
    regex: /\bnpm_[A-Za-z0-9]{36}\b/g,
  },
  {
    id: "jwt",
    label: "JSON Web Token",
    regex: /\beyJ[A-Za-z0-9_-]{18,}\.eyJ[A-Za-z0-9_-]{18,}\.[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    id: "pem_private_key",
    label: "PEM-encoded private key",
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/g,
  },
]);

/**
 * Stable, non-reversible 32-bit fingerprint suitable for audit logs.
 * Two prompts containing the same secret produce the same fingerprint, so
 * security teams can correlate occurrences without storing the raw value.
 */
export function fingerprint(value) {
  let h = 5381;
  for (let i = 0; i < value.length; i++) {
    h = ((h << 5) + h + value.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Renders a value as `xxxx…yyyy` for display in the user-facing block message.
 * Always preserves at most 4 characters at each end so the user can identify
 * which secret to rotate without re-exposing the full value in the UI.
 */
export function redact(value) {
  if (typeof value !== "string" || value.length === 0) return "";
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

/**
 * Returns every distinct string that should be scanned given a hook input
 * payload. We walk `attachments` defensively because its shape is not stable
 * across Cursor versions — strings, arrays, and nested objects are all
 * flattened into a list of strings.
 */
export function collectScanTexts(payload) {
  const out = [];
  if (payload && typeof payload.prompt === "string") {
    out.push(payload.prompt);
  }
  const seen = new WeakSet();
  const visit = (node) => {
    if (typeof node === "string") {
      out.push(node);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    for (const key of Object.keys(node)) visit(node[key]);
  };
  visit(payload?.attachments);
  return out;
}

/**
 * Scans a single string and returns one finding per match. Findings include
 * a fingerprint and a redacted preview, never the raw secret.
 */
export function scan(text) {
  if (typeof text !== "string" || text.length === 0) return [];
  const findings = [];
  for (const pattern of PATTERNS) {
    pattern.regex.lastIndex = 0;
    for (const match of text.matchAll(pattern.regex)) {
      findings.push({
        id: pattern.id,
        label: pattern.label,
        index: match.index ?? 0,
        length: match[0].length,
        fingerprint: fingerprint(match[0]),
        preview: redact(match[0]),
      });
    }
  }
  return findings;
}

/**
 * Scans every text returned by `collectScanTexts` and returns a deduplicated
 * list of findings keyed by (pattern id, fingerprint).
 */
export function scanPayload(payload) {
  const texts = collectScanTexts(payload);
  const byKey = new Map();
  for (const text of texts) {
    for (const finding of scan(text)) {
      const key = `${finding.id}:${finding.fingerprint}`;
      if (!byKey.has(key)) byKey.set(key, finding);
    }
  }
  return [...byKey.values()];
}
