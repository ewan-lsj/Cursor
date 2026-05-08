#!/usr/bin/env node
import { stdin } from "node:process";
const chunks = [];
for await (const c of stdin) chunks.push(c);
let payload = {};
try { payload = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch {}
const ti = payload.tool_input ?? {};
const candidates = [ti.target_file, ti.file_path, ti.path, ti.filePath]
  .filter((p) => typeof p === "string");
const violator = candidates.find((p) => /(^|\/)app\/api\//.test(p));
if (violator) {
  process.stdout.write(JSON.stringify({
    permission: "deny",
    reason: `Project policy: writes under app/api/ are blocked (attempted: ${violator}).`,
  }));
}
process.exit(0);
