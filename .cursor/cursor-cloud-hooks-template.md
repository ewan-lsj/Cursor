# Cursor Cloud Hook Template (Demo 2)

This template maps runtime hook points to concrete enforcement actions for this repository.

## Human-readable mapping

- Pre-implementation:
  - Run subagent: `repo-scout`
  - Purpose: minimize scope, define boundaries, and list verification commands.
- Post-edit:
  - Run checks: `npm run lint`, `npm run typecheck`
  - Purpose: enforce static quality gates automatically.
- Pre-handoff (or pre-PR):
  - Run subagent: `guardrail-reviewer`
  - Purpose: enforce repo rules and readiness criteria before handoff.

## Structured snippet (copy/paste template)

Adjust key names if your Cursor Cloud UI version uses different labels, but keep the same stages and actions.

```json
{
  "hooks": [
    {
      "stage": "pre_implementation",
      "actions": [
        {
          "type": "subagent",
          "agent": "repo-scout",
          "prompt": "Identify minimal file scope, data flow boundaries, relevant tests, and verification commands for the request. Return concrete next steps."
        }
      ]
    },
    {
      "stage": "post_edit",
      "actions": [
        {
          "type": "shell",
          "command": "npm run lint"
        },
        {
          "type": "shell",
          "command": "npm run typecheck"
        }
      ]
    },
    {
      "stage": "pre_handoff",
      "actions": [
        {
          "type": "subagent",
          "agent": "guardrail-reviewer",
          "prompt": "Review the change against .cursor/rules guidance, scope control, validation correctness, observability impact, and test evidence. Return blocking issues, non-blocking concerns, verification gaps, and ready/not-ready."
        }
      ]
    }
  ]
}
```

## Demo operator notes

- Keep Demo 1 unhooked if you want to emphasize pure automation first.
- Enable these hooks before Demo 2 to show runtime enforcement in action.
- Canonical policy files:
  - `.cursor/rules/repo-engineering-guardrails.mdc`
  - `.cursor/rules/next-api-observability.mdc`
