#!/usr/bin/env bash
# Regenerates the gitignored media in public/ from a raw source clip.
#   usage: scripts/prepare-media.sh /path/to/raw.mp4 <trim_start_s> <duration_s>
# The speaker plate is rendered at 1.25x the 1080x1920 target so Remotion's
# punch-ins and reframe stay sharp and never expose a frame edge.
set -euo pipefail
SRC="${1:?raw clip required}"; START="${2:-0}"; DUR="${3:-25.4}"
OUT="$(dirname "$0")/../public"

ffmpeg -y -ss "$START" -t "$DUR" -i "$SRC" \
  -vf "scale=1350:2400:flags=lanczos,unsharp=5:5:0.40:5:5:0.0" -an \
  -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p "$OUT/speaker.mp4"

# Voice: wind/rumble cut -> adaptive denoise -> presence EQ -> gentle comp,
# then two-pass loudness to -14 LUFS. Keep it STEREO: a mono downmix partially
# cancels the decorrelated channels and costs ~3 dB.
ffmpeg -y -i "$SRC" -vn \
  -af "highpass=f=85,afftdn=nr=12:nf=-30:tn=1,equalizer=f=300:t=q:w=1.2:g=-1.5,equalizer=f=3400:t=q:w=1.4:g=2.2,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=140:makeup=2,alimiter=limit=0.95" \
  -c:a pcm_s24le "$OUT/_voice_pre.wav"
ffmpeg -y -ss "$START" -t "$DUR" -i "$OUT/_voice_pre.wav" \
  -af "loudnorm=I=-14:TP=-1.5:LRA=9" -ar 48000 -c:a pcm_s16le "$OUT/voice.wav"
rm -f "$OUT/_voice_pre.wav"
echo "public/ media rebuilt"
