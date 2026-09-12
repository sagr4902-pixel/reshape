#!/usr/bin/env bash
# Claude Code status line: context remaining + subscription usage windows.
# Input: session JSON on stdin. See https://code.claude.com/docs/en/statusline
input=$(cat)

# --- parse ------------------------------------------------------------------
# One pass -> pipe-separated: ctx_remaining_pct, ctx_size, 5h_pct, 5h_reset, 7d_pct, 7d_reset
# (pipe, not tab: tab is IFS whitespace, so empty leading fields would collapse)
# Empty string means the field is absent (rate_limits is Pro/Max only, and only
# after the first API response; context fields are null before it).
read_fields() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$input" | jq -r '[
      (.context_window.remaining_percentage // ""),
      (.context_window.context_window_size   // ""),
      (.rate_limits.five_hour.used_percentage // ""),
      (.rate_limits.five_hour.resets_at       // ""),
      (.rate_limits.seven_day.used_percentage // ""),
      (.rate_limits.seven_day.resets_at       // "")
    ] | map(tostring) | join("|")' 2>/dev/null
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$input" | python3 -c '
import json,sys
try: d=json.load(sys.stdin)
except Exception: d={}
c=d.get("context_window") or {}
r=d.get("rate_limits") or {}
def g(o,k):
    v=(o or {}).get(k)
    return "" if v is None else v
print("|".join(str(x) for x in [
    g(c,"remaining_percentage"), g(c,"context_window_size"),
    g(r.get("five_hour"),"used_percentage"), g(r.get("five_hour"),"resets_at"),
    g(r.get("seven_day"),"used_percentage"), g(r.get("seven_day"),"resets_at"),
]))' 2>/dev/null
  fi
}
IFS='|' read -r CTX_PCT CTX_SIZE H5_PCT H5_AT D7_PCT D7_AT <<<"$(read_fields)"

# --- helpers ----------------------------------------------------------------
RESET=$'\033[0m'; DIM=$'\033[2m'; BOLD=$'\033[1m'
GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'

round() { printf '%.0f' "${1:-0}" 2>/dev/null || echo 0; }

bar() { # bar <pct> <color> -> 10-cell progress bar
  local n=$(( (${1:-0} + 5) / 10 )) i out=""
  (( n < 0 )) && n=0; (( n > 10 )) && n=10
  for ((i=0;i<10;i++)); do [ "$i" -lt "$n" ] && out+='█' || out+='░'; done
  printf '%s%s%s' "$2" "$out" "$RESET"
}

reset_at() { # epoch seconds -> " · resets 3:40pm", quietly skipped if unusable
  local e=$1 t
  [ -z "$e" ] && return
  e=$(round "$e")
  t=$(date -d "@$e" '+%-I:%M%p' 2>/dev/null) || t=$(date -r "$e" '+%-I:%M%p' 2>/dev/null) || return
  printf '%s · resets %s%s' "$DIM" "$(echo "$t" | tr 'APM' 'apm')" "$RESET"
}

row() { printf '%s %s%-9s%s %s %s%3d%%%s %s%s\n' "$1" "$BOLD" "$2" "$RESET" "$(bar "$3" "$4")" "$4" "$3" "$RESET" "$5" "$6"; }

# --- context remaining (green / yellow <40 / red <20) -----------------------
if [ -n "$CTX_PCT" ]; then
  P=$(round "$CTX_PCT")
  if   [ "$P" -lt 20 ]; then C=$RED
  elif [ "$P" -lt 40 ]; then C=$YELLOW
  else                       C=$GREEN; fi
  LEFT=''
  if [ -n "$CTX_SIZE" ]; then
    TOK=$(( $(round "$CTX_SIZE") * P / 100 ))
    LEFT="${DIM} · ~$(( TOK / 1000 ))k tokens${RESET}"
  fi
  row '🧠' 'CONTEXT' "$P" "$C" "${DIM}LEFT${RESET}" "$LEFT"
else
  printf '🧠 %sCONTEXT%s   %s%s%s\n' "$BOLD" "$RESET" "$DIM" '░░░░░░░░░░ awaiting first response' "$RESET"
fi

# --- usage windows (Pro/Max only; each may be absent) -----------------------
usage_row() { # <emoji> <label> <pct> <resets_at>
  [ -z "$3" ] && return
  local P C; P=$(round "$3")
  if   [ "$P" -ge 80 ]; then C=$RED
  elif [ "$P" -ge 60 ]; then C=$YELLOW
  else                       C=$GREEN; fi
  row "$1" "$2" "$P" "$C" "${DIM}USED${RESET}" "$(reset_at "$4")"
}
usage_row '⏱️' '5H USAGE' "$H5_PCT" "$H5_AT"
usage_row '📅' 'WEEKLY'   "$D7_PCT" "$D7_AT"
