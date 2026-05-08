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
)

for file in "${required_files[@]}"; do
  if [ ! -f "${file}" ]; then
    missing+=("${file}")
  fi
done

if [ "${#missing[@]}" -gt 0 ]; then
  joined="$(printf '%s, ' "${missing[@]}")"
  joined="${joined%, }"
  printf '{"ok":false,"reason":"missing_required_rule_files","missing":"%s"}\n' "${joined}"
  exit 2
fi

printf '{"ok":true,"stage":"afterFileEdit","message":"rule files verified"}\n'
exit 0
