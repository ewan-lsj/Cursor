#!/usr/bin/env node
/**
 * Cursor `beforeSubmitPrompt` hook: blocks the prompt from being submitted to
 * the model when it contains a value that matches a high-confidence secret
 * pattern (API keys, tokens, DSNs, private keys, …).
 *
 * Behaviour:
 *   - Reads the hook input JSON from stdin.
 *   - Scans the user prompt and any string content in `attachments`.
 *   - On a clean prompt: writes `{ "continue": true }` and exits 0.
 *   - On a finding:     writes `{ "continue": false, "user_message": ... }`
 *                       and exits 0.
 *   - On any internal error (bad JSON, unreadable stdin, etc.): writes
 *     `{ "continue": true }` and exits 0 — the hook fails OPEN by design so
 *     that automated remediation flows (e.g. Sentry-triggered cloud agents)
 *     are never deadlocked by a misbehaving scanner. Switch the per-script
 *     option `failClosed: true` in `.cursor/hooks.json` if your security
 *     posture prefers fail-closed.
 *   - Always appends a redacted JSON-lines audit record to
 *     `.cursor/hooks/.audit.log` for governance/audit review.
 *
 * Input/Output schema is documented at https://cursor.com/docs/hooks.
 */

import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { scanPayload } from "./secret-patterns.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const AUDIT_LOG_PATH = resolve(HERE, ".audit.log");
const MAX_INPUT_BYTES = 1_000_000;

async function readStdin() {
  const chunks = [];
  let total = 0;
  for await (const chunk of process.stdin) {
    total += chunk.length;
    if (total > MAX_INPUT_BYTES) {
      throw new Error(`hook input exceeded ${MAX_INPUT_BYTES} bytes`);
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function writeAudit(record) {
  try {
    await mkdir(dirname(AUDIT_LOG_PATH), { recursive: true });
    await appendFile(AUDIT_LOG_PATH, `${JSON.stringify(record)}\n`, "utf8");
  } catch (error) {
    process.stderr.write(`[scan-prompt-secrets] audit write failed: ${error?.message ?? error}\n`);
  }
}

function buildBlockMessage(findings) {
  const lines = [
    "Prompt blocked by enterprise secret-scanning hook.",
    "",
    "The following high-confidence secrets were detected in your prompt or its attachments:",
  ];
  for (const f of findings) {
    lines.push(`  • ${f.label} (${f.preview})`);
  }
  lines.push(
    "",
    "Remove these values from your prompt and re-send. If a secret was real,",
    "rotate it immediately — pasting it into chat means it has already left",
    "your machine context. Use environment variables, a secrets manager, or",
    "Cursor's @file references instead of pasting credentials inline.",
  );
  return lines.join("\n");
}

async function main() {
  let input;
  try {
    const raw = await readStdin();
    input = raw.length > 0 ? JSON.parse(raw) : {};
  } catch (error) {
    process.stderr.write(`[scan-prompt-secrets] input parse failed: ${error?.message ?? error}\n`);
    await writeAudit({
      ts: new Date().toISOString(),
      hook: "beforeSubmitPrompt",
      decision: "allow",
      reason: "input_parse_failed",
      error: String(error?.message ?? error),
    });
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  let findings = [];
  try {
    findings = scanPayload(input);
  } catch (error) {
    process.stderr.write(`[scan-prompt-secrets] scan failed: ${error?.message ?? error}\n`);
    await writeAudit({
      ts: new Date().toISOString(),
      hook: "beforeSubmitPrompt",
      conversation_id: input.conversation_id ?? null,
      generation_id: input.generation_id ?? null,
      decision: "allow",
      reason: "scan_failed",
      error: String(error?.message ?? error),
    });
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  const baseRecord = {
    ts: new Date().toISOString(),
    hook: "beforeSubmitPrompt",
    conversation_id: input.conversation_id ?? null,
    generation_id: input.generation_id ?? null,
    user_email: input.user_email ?? null,
    cursor_version: input.cursor_version ?? null,
    prompt_length: typeof input.prompt === "string" ? input.prompt.length : 0,
  };

  if (findings.length === 0) {
    await writeAudit({ ...baseRecord, decision: "allow", findings: [] });
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  await writeAudit({
    ...baseRecord,
    decision: "block",
    findings: findings.map((f) => ({ id: f.id, fingerprint: f.fingerprint })),
  });

  process.stdout.write(
    JSON.stringify({
      continue: false,
      user_message: buildBlockMessage(findings),
    }),
  );
}

main().catch((error) => {
  process.stderr.write(`[scan-prompt-secrets] unexpected failure: ${error?.message ?? error}\n`);
  process.stdout.write(JSON.stringify({ continue: true }));
});
