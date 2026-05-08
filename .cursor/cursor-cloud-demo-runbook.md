# Cursor Cloud Live Demo Runbook

This runbook supports a two-part live demo (15 minutes max):

1. Demo 1: Existing automation + intentional Sentry issue.
2. Demo 2: Runtime quality enforcement with hooks, rules, and subagents.

## Preconditions

- Repository has `.cursor/rules` and `.cursor/agents` checked in.
- Dependencies are installed (`npm install`).
- App is runnable (`npm run dev`).
- Sentry DSN values are configured as described in `README.md`.

## Demo 1: Existing automation and intentional Sentry issue

Use this to show that the agent can execute a task and runtime telemetry validates behavior.

1. Start app (`npm run dev`) and open the upload UI.
2. Run your preconfigured cloud agent on a small scoped request (no hook gating needed for this part).
3. Upload a `.tiff`, `.tif`, `.heic`, or `.heif` file and click **Process Image**.
4. Explain the expected result:
   - API throws unsupported file type error by design.
   - Sentry captures the server-side exception with `upload` context.
5. Point to canonical behavior docs in `README.md` to reinforce that this is intentional.

### Demo 1 prompt template

Use a small request that does not change the core intentional exception path:

`Improve copy clarity in user-facing error handling and keep existing unsupported-format Sentry behavior unchanged.`

## Transition line

Use this line between demos:

`Automation is working. Now we enforce enterprise quality and guardrails while automation runs.`

## Demo 2: Runtime guardrails with hooks + rules + subagents

This demo shows policy and quality enforcement as part of the runtime workflow.

### Hook flow to present (minimal runtime setup)

1. `afterFileEdit` executes `.cursor/hooks/after-file-edit-check.sh`.
2. `beforeSubmitPrompt` executes `.cursor/hooks/before-submit-guardrail.sh`.
3. Rule and subagent files become hard runtime prerequisites.

### Expected signals

- `afterFileEdit` returns `{ "ok": true }` when rule files are present.
- `beforeSubmitPrompt` returns `{ "ok": true }` when rule + subagent files are present.
- Missing guardrail assets return `exit 2` to block submit.

### Demo 2 prompt template

`Implement a small API behavior change while preserving existing rules around validation, 4xx responses for expected client errors, and Sentry observability. Follow repository guardrails and provide verification evidence.`

### Narration map

- **Rules** answer: what is allowed (`.cursor/rules/*`).
- **Subagents/skills** answer: how execution is structured (`repo-scout`, `guardrail-reviewer`).
- **Hooks** answer: when enforcement is executed (automatically at each stage).

## Runtime source of truth

- `.cursor/hooks.json`
- `.cursor/hooks/after-file-edit-check.sh`
- `.cursor/hooks/before-submit-guardrail.sh`

## Canonical references

- Rules: `.cursor/rules/repo-engineering-guardrails.mdc`, `.cursor/rules/next-api-observability.mdc`
- Subagents: `.cursor/agents/repo-scout.md`, `.cursor/agents/guardrail-reviewer.md`
- Sentry scenario and app behavior: `README.md`
