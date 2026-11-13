#!/usr/bin/env bash
# Final render + deliverables. Run from the videos/ folder after scripts/mix.py has produced public/audio/mix/reshape_mix.wav
set -euo pipefail
OUT=deliverables/reshape-campaign-v1
mkdir -p "$OUT" out
npx remotion render ReshapeFinal out/RESHAPE_campaign_v1_master.mp4 \
  --codec=h264 --crf=15 --pixel-format=yuv420p --color-space=bt709 \
  --audio-codec=aac --audio-bitrate=320k --concurrency=3 --log=error
cp out/RESHAPE_campaign_v1_master.mp4 "$OUT/RESHAPE_campaign_v1_1080x1920_30fps.mp4"
npx remotion still Cover "$OUT/RESHAPE_reel_cover_1080x1920.png" --log=error
cp public/audio/mix/reshape_mix.wav "$OUT/RESHAPE_audio_mix.wav"
cp public/audio/mix/stem_vo.wav "$OUT/RESHAPE_stem_voiceover.wav"
cp public/audio/mix/stem_sfx.wav "$OUT/RESHAPE_stem_sfx.wav"
echo "--- verify"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,color_space,sample_rate,channels -show_entries format=duration -of compact "$OUT/RESHAPE_campaign_v1_1080x1920_30fps.mp4"
ffmpeg -hide_banner -nostats -i "$OUT/RESHAPE_campaign_v1_1080x1920_30fps.mp4" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|True peak|Peak:" | tail -3
