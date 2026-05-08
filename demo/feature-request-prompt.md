# Demo 2 — Feature request prompt (copy/paste)

Paste this into a fresh Cursor cloud agent run on `main` (or a branch off
`main`). It is intentionally written the way an ops ticket would arrive,
so the agent has to consult the repo rules itself rather than be told what
they are.

The `afterFileEdit` hook in `.cursor/hooks.json` will fire on every edit
and append an audit line to `.cursor/hooks/edits.log` — that file is the
on-stage artifact for the "structural enforcement" half of the bridge.

---

**[FEATURE REQUEST — ops]** Cap upload size on `/api/process`.

Last week one of our SRE engineers caught a 38 MB upload that pushed the
serverless function past its memory budget. We want a hard server-side
cap so the function returns cleanly instead of OOM-ing.

Requirements:

- Reject uploads larger than **8 MB** at the `/api/process` route.
- The rejection must come back as a structured client-error response
  (not a thrown exception), so the existing UI's error banner can render
  the message verbatim.
- Surface the limit to the browser too — the UI's "selected file" panel
  should warn the user before they hit Process when the file is over the
  cap, using the **same constant** as the server.
- Keep Sentry useful: oversized uploads are an expected client mistake,
  so they should not fire as captured exceptions; if any context is
  attached, it must respect the existing observability rules.
- Add a focused unit test for whatever shared constant / helper you
  introduce, alongside the existing `lib/image-formats` tests.

Process:

1. Start with the **repo-scout** subagent to map the smallest set of
   files involved and call out existing patterns I should follow.
2. Implement the change, honouring everything under `.cursor/rules/`.
3. Before you hand off, run the **guardrail-reviewer** subagent against
   your diff and address anything blocking.
4. Run `npm run lint`, `npm run typecheck`, and `npm test` and report
   the exact output.
