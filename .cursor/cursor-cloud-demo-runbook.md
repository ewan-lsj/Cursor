# Cursor Cloud Live Demo Runbook

This runbook supports a two-part live demo:

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

### Hook flow to present

1. **Pre-implementation hook**: run `repo-scout` subagent.
2. **Post-edit hook**: run `npm run lint` and `npm run typecheck`.
3. **Pre-handoff/pre-PR hook**: run `guardrail-reviewer` subagent.

### Expected signals

- `repo-scout` returns minimal file scope, data flow boundaries, and verification commands.
- lint/typecheck pass and provide objective quality signal.
- `guardrail-reviewer` reports:
  1. blocking issues;
  2. non-blocking concerns;
  3. verification gaps;
  4. ready/not-ready recommendation.

### Demo 2 prompt template

`Implement a small API behavior change while preserving existing rules around validation, 4xx responses for expected client errors, and Sentry observability. Follow repository guardrails and provide verification evidence.`

### Narration map

- **Rules** answer: what is allowed (`.cursor/rules/*`).
- **Subagents/skills** answer: how execution is structured (`repo-scout`, `guardrail-reviewer`).
- **Hooks** answer: when enforcement is executed (automatically at each stage).

## Canonical references

- Rules:
  - `.cursor/rules/repo-engineering-guardrails.mdc`
  - `.cursor/rules/next-api-observability.mdc`
- Subagents:
  - `.cursor/agents/repo-scout.md`
  - `.cursor/agents/guardrail-reviewer.md`
- Sentry scenario and app behavior:
  - `README.md`
