#!/usr/bin/env bash
# beforeShellExecution hook — guard against destructive commands.
#
# Per the Cursor 1.7 hooks spec, beforeShellExecution receives the
# pending shell command on stdin as JSON and may respond with a JSON
# decision on stdout: { "permission": "allow" | "deny", ... }.
# Returning permission=deny stops the agent from running the command
# and surfaces user_message / agent_message in the transcript so the
# rejection is visible in real time.
#
# Behaviour:
#   1. Parse the pending command from stdin.
#   2. Match it against a curated list of destructive patterns.
#   3. On match: emit a deny decision with a clear reason, append a
#      JSONL record to .cursor/hooks/denials.log (gitignored), and
#      print a short banner to stderr for the transcript.
#   4. Otherwise: allow.
#
# Fail-open by design: any internal error falls through to "allow"
# rather than wedging the agent. Flip the matching `failClosed: true`
# in hooks.json if you need strict enforcement.

set -u

INPUT="$(cat)"

emit_allow() {
  printf '{"permission":"allow"}\n'
  exit 0
}

emit_deny() {
  local reason="$1"
  local cmd="$2"
  local user_msg
  local agent_msg

  user_msg="Blocked by shell-guard: ${reason}"
  agent_msg=$(printf 'The command \"%s\" was blocked by the project shell-guard hook.\nReason: %s\nIf this is intentional, ask the user to run it manually or relax .cursor/hooks/shell-guard.sh.' "$cmd" "$reason")

  if command -v jq >/dev/null 2>&1; then
    jq -nc \
      --arg user_message "$user_msg" \
      --arg agent_message "$agent_msg" \
      '{permission:"deny", user_message:$user_message, agent_message:$agent_message}'
  else
    user_msg_escaped=${user_msg//\"/\\\"}
    agent_msg_escaped=${agent_msg//\"/\\\"}
    agent_msg_escaped=${agent_msg_escaped//$'\n'/\\n}
    printf '{"permission":"deny","user_message":"%s","agent_message":"%s"}\n' \
      "$user_msg_escaped" "$agent_msg_escaped"
  fi

  printf '[hook] beforeShellExecution DENIED (%s): %s\n' "$reason" "$cmd" >&2

  WORKSPACE=""
  if command -v jq >/dev/null 2>&1; then
    WORKSPACE="$(printf '%s' "$INPUT" | jq -r '.workspace_roots[0] // ""' 2>/dev/null || true)"
  fi
  [ -z "$WORKSPACE" ] || [ ! -d "$WORKSPACE" ] && WORKSPACE="$(pwd)"
  LOG_DIR="$WORKSPACE/.cursor/hooks"
  LOG_FILE="$LOG_DIR/denials.log"
  mkdir -p "$LOG_DIR" 2>/dev/null || true
  TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$INPUT" | jq -c \
      --arg ts "$TIMESTAMP" \
      --arg reason "$reason" \
      '{ts:$ts, reason:$reason, conversation_id:(.conversation_id//null), generation_id:(.generation_id//null), command:(.command//null), cwd:(.cwd//null)}' \
      >> "$LOG_FILE" 2>/dev/null || true
  fi

  exit 0
}

CMD=""
if command -v jq >/dev/null 2>&1; then
  CMD="$(printf '%s' "$INPUT" | jq -r '.command // ""' 2>/dev/null || true)"
fi

if [ -z "$CMD" ]; then
  emit_allow
fi

# Normalise once for case-insensitive matching.
CMD_LC="$(printf '%s' "$CMD" | tr '[:upper:]' '[:lower:]')"

# Each rule is "regex|||reason". Order matters: more specific rules first.
RULES=(
  # Recursive, forced removal of root, home, or unbounded globs.
  '(^|[^a-z])rm[[:space:]]+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|--recursive[[:space:]]+--force|--force[[:space:]]+--recursive)([[:space:]].*)?[[:space:]](/|/\*|~|~/|\$home|\*)([[:space:]]|$)|||recursive force-delete of system root, home, or unbounded glob'

  # Any rm -rf / something that targets the filesystem root.
  '(^|[^a-z])rm[[:space:]]+-[a-z]*[rf][a-z]*[rf][a-z]*[[:space:]]+/([[:space:]]|$)|||rm -rf targeting /'

  # mkfs.* — formatting a filesystem.
  '(^|[^a-z])mkfs(\.|[[:space:]])|||mkfs filesystem format'

  # dd writing to a block device.
  '(^|[^a-z])dd[[:space:]].*of=/dev/(sd|nvme|hd|vd|mmcblk|disk)|||dd writing raw bytes to a block device'

  # Classic bash fork bomb.
  ':\(\)[[:space:]]*\{[[:space:]]*:\|:&[[:space:]]*\};:|||fork bomb pattern'

  # Piping a remote payload straight into a shell.
  '(curl|wget|fetch)[[:space:]].*\|[[:space:]]*(sudo[[:space:]]+)?(sh|bash|zsh|ksh|dash|fish)([[:space:]]|$)|||piping remote payload directly into a shell'

  # Force-pushing to a protected branch.
  'git[[:space:]]+push[[:space:]]+(.*[[:space:]])?(--force|-f)([[:space:]]+.*[[:space:]]|[[:space:]])(main|master|release/[a-z0-9._-]+)([[:space:]]|$)|||git force-push to a protected branch'

  # Recursive chmod 777 against root or home.
  'chmod[[:space:]]+(-[a-z]*r[a-z]*|--recursive)[[:space:]]+0?777[[:space:]]+(/|~|\$home)([[:space:]]|$)|||recursive chmod 777 against root or home'

  # Power state changes from the agent.
  '(^|[^a-z])(shutdown|reboot|halt|poweroff|init[[:space:]]+0)([[:space:]]|$)|||system power-state change'

  # Anything elevated with sudo — too blunt for an autonomous agent.
  '(^|[^a-z])sudo([[:space:]]|$)|||sudo elevation requested'

  # Same intent as sudo: common elevation substitutes agents use when sudo is blocked.
  '(^|[^a-z])(doas|pkexec|runuser)([[:space:]]|$)|||privilege elevation via doas, pkexec, or runuser'

  # Switch to root shell (same class as elevation).
  '(^|[^a-z])su[[:space:]]+(-[[:space:]]*|[[:space:]]+(-|--login)[[:space:]]*)(root|0)([[:space:]]|$)|||su to root'
)

for rule in "${RULES[@]}"; do
  pattern="${rule%%|||*}"
  reason="${rule##*|||}"
  if printf '%s' "$CMD_LC" | grep -Eq -- "$pattern"; then
    emit_deny "$reason" "$CMD"
  fi
done

emit_allow
