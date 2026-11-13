#!/usr/bin/env bash
# v3 hype short: final render + deliverables (run after: python3 scripts/cues3_build.py)
set -euo pipefail
OUT=deliverables/reshape-hype-v3
mkdir -p "$OUT" out
npx remotion render HypeV3Final out/RESHAPE_hype_v3_master.mp4 \
  --codec=h264 --crf=16 --pixel-format=yuv420p --color-space=bt709 \
  --audio-codec=aac --audio-bitrate=320k --concurrency=3 --log=error
cp out/RESHAPE_hype_v3_master.mp4 "$OUT/RESHAPE_hype_v3_1080x1920_30fps.mp4"
ffmpeg -v error -y -i out/RESHAPE_hype_v3_master.mp4 -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart -c:a copy "$OUT/RESHAPE_hype_v3_web.mp4"
npx remotion still HypeV3Silent "$OUT/RESHAPE_hype_v3_cover_1080x1920.png" --frame=34 --log=error
cp public/audio/mix3/hype_mix.wav "$OUT/RESHAPE_hype_v3_audio_mix.wav"
cp public/audio/mix3/stem_vo.wav "$OUT/RESHAPE_hype_v3_stem_voiceover.wav"
cp public/audio/mix3/stem_sfx.wav "$OUT/RESHAPE_hype_v3_stem_sfx.wav"
echo "--- verify"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,color_space,sample_rate,channels -show_entries format=duration -of compact "$OUT/RESHAPE_hype_v3_1080x1920_30fps.mp4"
ffmpeg -hide_banner -nostats -i "$OUT/RESHAPE_hype_v3_1080x1920_30fps.mp4" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
ls -la "$OUT"
