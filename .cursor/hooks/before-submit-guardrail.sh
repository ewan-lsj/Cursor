#!/usr/bin/env bash
set -euo pipefail

# Read and ignore hook payload while preserving command-hook contract.
payload="$(cat)"
if [ -z "${payload}" ]; then
  payload="{}"
fi

missing=()

required_files=(
  ".cursor/rules/repo-engineering-guardrails.mdc"
  ".cursor/rules/next-api-observability.mdc"
  ".cursor/agents/repo-scout.md"
  ".cursor/agents/guardrail-reviewer.md"
)

for file in "${required_files[@]}"; do
  if [ ! -f "${file}" ]; then
    missing+=("${file}")
  fi
done

if [ "${#missing[@]}" -gt 0 ]; then
  joined="$(printf '%s, ' "${missing[@]}")"
  joined="${joined%, }"
  printf '{"ok":false,"reason":"guardrail_assets_missing","missing":"%s"}\n' "${joined}"
  exit 2
fi

printf '{"ok":true,"stage":"beforeSubmitPrompt","message":"guardrail assets verified"}\n'
exit 0
