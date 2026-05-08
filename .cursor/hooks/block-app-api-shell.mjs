#!/usr/bin/env node
import { stdin } from "node:process";
const chunks = [];
for await (const c of stdin) chunks.push(c);
let payload = {};
try { payload = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch {}
const cmd = String(payload?.tool_input?.command ?? "");
if (/(^|[\s'"=])app\/api\//.test(cmd)) {
  process.stdout.write(JSON.stringify({
    permission: "deny",
    reason: `Project policy: shell commands touching app/api/ are blocked (command: ${cmd}).`,
  }));
}
process.exit(0);
