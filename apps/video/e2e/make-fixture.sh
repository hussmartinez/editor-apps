#!/usr/bin/env bash
# Generates fixtures/clip.webm, the smoke test's video, from FFmpeg's
# synthetic sources: a test pattern with a frame counter and a sine tone, never
# a recording. VP8 and Opus, which Chromium decodes in WebCodecs. 320 × 180 at
# 30 fps, 1 second. Deterministic, so rerunning it rewrites the same bytes.
set -euo pipefail
cd "$(dirname "$0")/fixtures"
ffmpeg -y -v error \
  -f lavfi -i "testsrc2=size=320x180:rate=30:duration=1" \
  -f lavfi -i "sine=frequency=440:sample_rate=48000:duration=1" \
  -c:v libvpx -deadline good -cpu-used 5 -crf 40 -b:v 200k -threads 1 -g 30 \
  -c:a libopus -b:a 24k -ac 2 \
  -fflags +bitexact -flags:v +bitexact -flags:a +bitexact -map_metadata -1 -map_chapters -1 \
  -shortest clip.webm
