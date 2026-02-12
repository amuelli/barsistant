#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

codex_sandbox="${CODEX_SANDBOX:-workspace-write}"
codex_unsafe_mode="${CODEX_UNSAFE_MODE:-1}"

for ((i=1; i<=$1; i++)); do
  result_file=$(mktemp)
  prompt_file=$(mktemp)
  trap 'rm -f "$result_file" "$prompt_file"' EXIT
  echo "------- ITERATION $i --------"

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

  {
    cat plans/prompt.md
    printf "\n\nACTIVE_ISSUE_FILE: %s\n" "$active_issue_file"
    printf "\n\nISSUES:\n%s\n" "$issues"
    printf "\nPrevious RALPH commits:\n%s\n" "$ralph_commits"
  } > "$prompt_file"

  if [ "$codex_unsafe_mode" = "1" ]; then
    codex exec --dangerously-bypass-approvals-and-sandbox --output-last-message "$result_file" - < "$prompt_file"
  else
    codex exec --full-auto --sandbox "$codex_sandbox" --output-last-message "$result_file" - < "$prompt_file"
  fi

  result=$(cat "$result_file")

  if [[ "$result" == *"<promise>NO MORE TASKS</promise>"* ]]; then
    echo "Ralph complete after $i iterations."
    exit 0
  fi

  if [[ "$result" == *"<promise>ABORT</promise>"* ]]; then
    echo "Ralph aborted after $i iterations."
    exit 1
  fi
done
