#!/usr/bin/env bash
# Delivery encode. Remotion renders full-range JPEG-derived colour (yuvj420p,
# untagged primaries); Instagram expects limited-range BT.709. This converts
# the range properly, tags it, and lands loudness on the -14 LUFS target.
set -euo pipefail
IN="${1:?input mp4}"; OUT="${2:?output mp4}"
"/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2" -y -i "$IN" \
  -vf "scale=in_range=pc:out_range=tv,format=yuv420p" \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
  -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.1 \
  -x264-params "keyint=60:min-keyint=30" \
  -af "loudnorm=I=-14:TP=-1.5:LRA=9" \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart "$OUT"
