# `.cursor/hooks/`

Production-grade [Cursor hooks](https://cursor.com/docs/hooks) for this
repository. Hooks run for every Agent / Cmd-K session opened against this
project, including remote cloud agents (e.g. the Sentry-triggered
remediation flow used in demo 1).

## Installed hooks

| Event                | Script                          | Type    | Purpose                                                                             |
| -------------------- | ------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `beforeSubmitPrompt` | `scan-prompt-secrets.mjs`       | command | Block prompts that contain high-confidence credentials before they reach the model. |

## `scan-prompt-secrets.mjs`

Deterministic secret scanner. Runs on the user's machine (or the cloud-agent
VM) before the prompt is shipped to a model. It is a hard guardrail, not an
LLM heuristic — every match is a regex hit on a published credential format.

### Detection coverage

Categories below are matched by exact format only (low false-positive rate):

- AWS access key IDs and `aws_secret_access_key=...` assignments
- GitHub PATs, OAuth, app/server/refresh, fine-grained PATs
- Sentry DSNs and `sntrys_*` / `sntryu_*` auth tokens
- Stripe `sk_*` / `rk_*` (live & test) and `pk_live_*` keys
- Slack tokens (`xox[abprs]-…`) and incoming-webhook URLs
- Google API keys (`AIza…`)
- OpenAI keys (`sk-…`, `sk-proj-…`)
- Anthropic keys (`sk-ant-api03-…`)
- npm publish tokens (`npm_…`)
- JWTs (RFC 7519, `eyJ…`)
- PEM-encoded private keys (`-----BEGIN … PRIVATE KEY-----`)

The full pattern list is in [`secret-patterns.mjs`](./secret-patterns.mjs).
Add a new category by appending a `{ id, label, regex }` entry — the scanner
and tests pick it up automatically.

### Output contract

The hook always writes a single JSON object to stdout, per the
[Cursor hook spec](https://cursor.com/docs/hooks):

| Outcome      | stdout                                                              |
| ------------ | ------------------------------------------------------------------- |
| Clean prompt | `{"continue": true}`                                                |
| Match        | `{"continue": false, "user_message": "Prompt blocked …"}`           |
| Internal err | `{"continue": true}` (fail-open — see below)                        |

The `user_message` lists the secret kinds that matched, with each value
redacted to `xxxx…yyyy` so the UI never re-leaks the raw credential.

### Fail-open by default

`failClosed` in `hooks.json` is `false`. If the scanner crashes, the prompt
is allowed through. This is deliberate for two reasons:

1. **Demo-1 safety.** The Sentry-triggered cloud-agent flow must not be
   deadlocked by a hook bug. A failing scanner in front of an automated
   remediation pipeline would silently break production triage.
2. **Defence in depth.** Secret leakage has multiple downstream controls
   (Sentry data-scrubbing, server-side env management, log redaction). A
   single hook outage is recoverable.

For environments where blocking on scanner failure is preferred, set
`"failClosed": true` in `.cursor/hooks.json`.

### Audit log

Every invocation appends one JSON line to `.cursor/hooks/.audit.log`
(gitignored). Records include `conversation_id`, `generation_id`,
`user_email`, `cursor_version`, the decision (`allow` / `block`), and — for
blocks — the matching pattern IDs plus a stable 32-bit fingerprint of each
secret. **Raw secret values are never written to the log**, only fingerprints
and pattern IDs, so the log itself is safe to ship to a SIEM.

Sample record:

```json
{
  "ts": "2026-05-08T21:42:11.034Z",
  "hook": "beforeSubmitPrompt",
  "conversation_id": "conv_…",
  "generation_id": "gen_…",
  "user_email": "alex@example.com",
  "cursor_version": "1.7.2",
  "prompt_length": 184,
  "decision": "block",
  "findings": [{ "id": "github_personal_access_token", "fingerprint": "9f2a01c4" }]
}
```

### Testing

Pure-function coverage lives in
[`__tests__/secret-scanner.test.ts`](../../__tests__/secret-scanner.test.ts)
and runs under the existing `npm test` (vitest) command. The CLI wrapper is
small and intentionally I/O-only.

### Why this is safe for demo 1 (Sentry remediation)

The Sentry-triggered cloud agent receives a prompt synthesised from a Sentry
issue: an exception message (`Unsupported file type: image/tiff …`), the
upload context (`{filename, mimetype, size}`), and a stack trace. None of
those fields match any of the patterns above — they are not credentials. A
regression test (`allows the demo-1 Sentry remediation prompt`) locks this
in. If you add a new pattern, keep that test passing.
