#!/bin/sh
# يركّب كل مشهد = المكتبة المشتركة + المشهد
W=$(cd "$(dirname "$0")/.." && pwd)
for f in "$W"/src/s*.js; do cat "$W/src/_lib.js" "$f" > "$W/scenes/$(basename "$f")"; done
