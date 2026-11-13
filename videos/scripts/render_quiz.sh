#!/usr/bin/env bash
# v2 quiz: final render + deliverables (run after: python3 scripts/cues2_build.py)
set -euo pipefail
OUT=deliverables/reshape-quiz-v2
mkdir -p "$OUT" out
npx remotion render QuizV2Final out/RESHAPE_quiz_v2_master.mp4 \
  --codec=h264 --crf=16 --pixel-format=yuv420p --color-space=bt709 \
  --audio-codec=aac --audio-bitrate=320k --concurrency=3 --log=error
cp out/RESHAPE_quiz_v2_master.mp4 "$OUT/RESHAPE_quiz_v2_1080x1920_30fps.mp4"
ffmpeg -v error -y -i out/RESHAPE_quiz_v2_master.mp4 -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart -c:a copy "$OUT/RESHAPE_quiz_v2_web.mp4"
npx remotion still QuizCover "$OUT/RESHAPE_quiz_v2_cover_1080x1920.png" --log=error
cp public/audio/mix2/quiz_mix.wav "$OUT/RESHAPE_quiz_v2_audio_mix.wav"
cp public/audio/mix2/stem_vo.wav "$OUT/RESHAPE_quiz_v2_stem_voiceover.wav"
cp public/audio/mix2/stem_sfx.wav "$OUT/RESHAPE_quiz_v2_stem_sfx.wav"
echo "--- verify"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,color_space,sample_rate,channels -show_entries format=duration -of compact "$OUT/RESHAPE_quiz_v2_1080x1920_30fps.mp4"
ffmpeg -hide_banner -nostats -i "$OUT/RESHAPE_quiz_v2_1080x1920_30fps.mp4" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
ls -la "$OUT"
