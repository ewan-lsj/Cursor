# Cursor Cloud Hook Template (Demo 2, 15-minute version)

This template maps runtime hook points to concrete enforcement actions for this repository.

## Human-readable mapping

- After file edit:
  - Run command hook: `.cursor/hooks/after-file-edit-check.sh`
  - Purpose: validate required rule files exist.
- Before submit prompt:
  - Run command hook: `.cursor/hooks/before-submit-guardrail.sh`
  - Purpose: validate required rules and subagent files exist before handoff.

## Structured snippet (copy/paste template)

Use project-level hooks (`<project>/.cursor/hooks.json`) and project-root paths.

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [
      {
        "command": ".cursor/hooks/after-file-edit-check.sh"
      }
    ],
    "beforeSubmitPrompt": [
      {
        "command": ".cursor/hooks/before-submit-guardrail.sh"
      }
    ]
  }
}
```

## Demo operator notes

- Keep Demo 1 unhooked if you want to emphasize pure automation first.
- Enable this minimal hook set before Demo 2 to show runtime enforcement in action.
- Canonical policy files:
  - `.cursor/rules/repo-engineering-guardrails.mdc`
  - `.cursor/rules/next-api-observability.mdc`
