#!/usr/bin/env bash
# Run `hyperframes check` (lint + runtime + layout + motion + contrast) and print only the findings and
# the verdict. The full log is kept in a temp file for details.
# usage: bash scripts/qa/check-summary.sh
set -uo pipefail
export LC_ALL=C
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
LOG="$(mktemp -t check-log).txt"
bash scripts/hf.sh check >"$LOG" 2>&1
STATUS=$?
grep -n "✗\|⚠\|ℹ" "$LOG" | head -120
grep -E "error\(s\)|Check (passed|failed)" "$LOG" | tail -8
echo "full log: $LOG"
exit $STATUS
