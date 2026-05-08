#!/usr/bin/env node
/**
 * Cursor postToolUse hook (matcher: Write only — see .cursor/hooks.json).
 * Matchers filter by tool type, not by path; we detect app/api/ touches here.
 */
import { stdin } from "node:process";

async function main() {
  const chunks = [];
  for await (const chunk of stdin) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  try {
    const payload = JSON.parse(raw);
    const blob = JSON.stringify(payload);

    if (blob.includes("app/api/")) {
      console.error(
        "[hook] app/api file written — run npm run typecheck && npm test when done; use @guardrail-reviewer before handoff."
      );
    }
  } catch {
    // ignore malformed stdin
  }
}

main().then(() => process.exit(0));
