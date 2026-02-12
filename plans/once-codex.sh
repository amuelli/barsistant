#!/bin/bash

set -e

codex_sandbox="${CODEX_SANDBOX:-workspace-write}"
codex_unsafe_mode="${CODEX_UNSAFE_MODE:-1}"

issues=""
active_issue_file="NONE"
if [ -d "issues" ]; then
  for f in issues/*.md; do
    if [ -f "$f" ]; then
      if [ "$active_issue_file" = "NONE" ]; then
        active_issue_file="$f"
      fi
      issues+="--- $(basename "$f") ---
$(cat "$f")

"
    fi
  done
fi

ralph_commits=$(git log --grep="RALPH" -n 10 --format="%H%n%ad%n%B---" --date=short 2>/dev/null || echo "No RALPH commits found")

prompt_file=$(mktemp)
trap 'rm -f "$prompt_file"' EXIT

{
  cat plans/prompt.md
  printf "\n\nACTIVE_ISSUE_FILE: %s\n" "$active_issue_file"
  printf "\n\nISSUES:\n%s\n" "$issues"
  printf "\nPrevious RALPH commits:\n%s\n" "$ralph_commits"
} > "$prompt_file"

if [ "$codex_unsafe_mode" = "1" ]; then
  codex exec --dangerously-bypass-approvals-and-sandbox - < "$prompt_file"
else
  codex exec --full-auto --sandbox "$codex_sandbox" - < "$prompt_file"
fi
