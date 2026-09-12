#!/usr/bin/env bash
# Claude Code status line: one compact line with context remaining and usage windows.
# Input: session JSON on stdin. See https://code.claude.com/docs/en/statusline
input=$(cat)

# --- parse ------------------------------------------------------------------
# One pass -> pipe-separated: ctx_remaining_pct, 5h_used_pct, 7d_used_pct
# (pipe, not tab: tab is IFS whitespace, so empty leading fields would collapse)
# Empty string means the field is absent: rate_limits is Pro/Max only and only
# after the first API response, and context is null before it.
read_fields() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$input" | jq -r '[
      (.context_window.remaining_percentage  // ""),
      (.rate_limits.five_hour.used_percentage // ""),
      (.rate_limits.seven_day.used_percentage // "")
    ] | map(tostring) | join("|")' 2>/dev/null
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$input" | python3 -c '
import json,sys
try: d=json.load(sys.stdin)
except Exception: d={}
r=d.get("rate_limits") or {}
def g(o,k):
    v=(o or {}).get(k)
    return "" if v is None else v
print("|".join(str(x) for x in [
    g(d.get("context_window"),"remaining_percentage"),
    g(r.get("five_hour"),"used_percentage"),
    g(r.get("seven_day"),"used_percentage"),
]))' 2>/dev/null
  fi
}
IFS='|' read -r CTX_PCT H5_PCT D7_PCT <<<"$(read_fields)"

# --- helpers ----------------------------------------------------------------
RESET=$'\033[0m'; DIM=$'\033[2m'
GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'

bar() { # bar <pct> -> 5-cell progress bar
  local n=$(( (${1:-0} + 10) / 20 )) i out=''
  (( n < 0 )) && n=0; (( n > 5 )) && n=5
  for ((i=0;i<5;i++)); do [ "$i" -lt "$n" ] && out+='█' || out+='░'; done
  printf '%s' "$out"
}

segment() { # segment <emoji> <label> <pct> <color> <verb>
  printf '%s %s: %s%s %d%% %s%s' "$1" "$2" "$4" "$(bar "$3")" "$3" "$5" "$RESET"
}

SEGS=()

# --- context remaining (green / yellow below 40 / red below 20) -------------
if [ -n "$CTX_PCT" ]; then
  P=$(printf '%.0f' "$CTX_PCT" 2>/dev/null || echo 0)
  if   [ "$P" -lt 20 ]; then C=$RED
  elif [ "$P" -lt 40 ]; then C=$YELLOW
  else                       C=$GREEN; fi
  SEGS+=("$(segment '🧠' 'Context' "$P" "$C" 'left')")
else
  SEGS+=("${DIM}🧠 Context: pending${RESET}")
fi

# --- usage windows (Pro/Max only; each may be absent) -----------------------
usage_seg() { # usage_seg <emoji> <label> <pct>
  [ -z "$3" ] && return
  local P C; P=$(printf '%.0f' "$3" 2>/dev/null || echo 0)
  if   [ "$P" -ge 80 ]; then C=$RED
  elif [ "$P" -ge 60 ]; then C=$YELLOW
  else                       C=$GREEN; fi
  SEGS+=("$(segment "$1" "$2" "$P" "$C" 'used')")
}
usage_seg '⏱' '5H'     "$H5_PCT"
usage_seg '📅' 'Weekly' "$D7_PCT"

# --- join into one line -----------------------------------------------------
out=''
for s in "${SEGS[@]}"; do
  [ -n "$out" ] && out+="${DIM} | ${RESET}"
  out+="$s"
done
printf '%s\n' "$out"
