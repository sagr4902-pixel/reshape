#!/usr/bin/env bash
# «لوحة تقدّمك» (BoardV1): final render + deliverables (run after: python3 scripts/cues4_build.py)
set -euo pipefail
OUT=deliverables/reshape-board-v1
mkdir -p "$OUT" out
npx remotion render BoardV1Final out/RESHAPE_board_v1_master.mp4 \
  --codec=h264 --crf=16 --pixel-format=yuv420p --color-space=bt709 \
  --audio-codec=aac --audio-bitrate=320k --concurrency=3 --log=error
cp out/RESHAPE_board_v1_master.mp4 "$OUT/RESHAPE_board_v1_1080x1920_30fps.mp4"
ffmpeg -v error -y -i out/RESHAPE_board_v1_master.mp4 -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart -c:a copy "$OUT/RESHAPE_board_v1_web.mp4"
npx remotion still BoardV1 "$OUT/RESHAPE_board_v1_cover_1080x1920.png" --frame=520 --log=error
cp public/audio/mix4/board_mix.wav "$OUT/RESHAPE_board_v1_audio_mix.wav"
echo "--- verify"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of compact "$OUT/RESHAPE_board_v1_1080x1920_30fps.mp4"
ffmpeg -hide_banner -nostats -i "$OUT/RESHAPE_board_v1_1080x1920_30fps.mp4" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
