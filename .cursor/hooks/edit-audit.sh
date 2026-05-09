#!/usr/bin/env bash
# afterFileEdit hook — deterministic edit audit trail.
#
# Runs in whichever environment the Cursor agent is executing in (local
# IDE or cloud-agent VM). Per the Cursor 1.7 hooks spec, afterFileEdit is
# informational only — its output is not interpreted by the agent and it
# cannot block or modify behaviour. That property is intentional: this
# hook adds an audit signal without changing how any other flow runs,
# including the Sentry-triggered Demo 1 automation.
#
# Behaviour:
#   1. Read the afterFileEdit JSON payload from stdin.
#   2. Append one JSON line per edit to .cursor/hooks/edits.log
#      (gitignored), with timestamp, conversation_id, generation_id,
#      file_path, and per-edit char deltas.
#   3. Emit a one-line banner on stderr so the agent transcript shows
#      the audit fired.

set -u

INPUT="$(cat)"

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

FILE_PATH="$(printf '%s' "$INPUT" | jq -r '.file_path // ""' 2>/dev/null || true)"
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

WORKSPACE="$(printf '%s' "$INPUT" | jq -r '.workspace_roots[0] // ""' 2>/dev/null || true)"
if [ -z "$WORKSPACE" ] || [ ! -d "$WORKSPACE" ]; then
  WORKSPACE="$(pwd)"
fi

LOG_DIR="$WORKSPACE/.cursor/hooks"
LOG_FILE="$LOG_DIR/edits.log"
mkdir -p "$LOG_DIR"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

RECORD="$(printf '%s' "$INPUT" | jq -c \
  --arg ts "$TIMESTAMP" \
  '{
    ts: $ts,
    conversation_id: (.conversation_id // null),
    generation_id: (.generation_id // null),
    file_path: (.file_path // null),
    edits: ((.edits // []) | map({
      removed_chars: ((.old_string // "") | length),
      added_chars:   ((.new_string // "") | length)
    })),
    edit_count: ((.edits // []) | length)
  }' 2>/dev/null || true)"

if [ -n "$RECORD" ]; then
  printf '%s\n' "$RECORD" >> "$LOG_FILE"
fi

EDIT_COUNT="$(printf '%s' "$INPUT" | jq -r '((.edits // []) | length)' 2>/dev/null || echo 0)"
printf '[hook] afterFileEdit audited %s edit(s) on %s -> .cursor/hooks/edits.log\n' "$EDIT_COUNT" "$FILE_PATH" >&2

exit 0
