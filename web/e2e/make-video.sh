#!/usr/bin/env bash
# Concatenate the per-test Playwright videos (in execution order) into one mp4.
# Usage: bash e2e/make-video.sh <phase-name>
set -euo pipefail

PHASE="${1:-fase}"
OUT_DIR="e2e/artifacts"
mkdir -p "$OUT_DIR"

# Videos sorted by mtime == execution order (tests run serially, workers=1).
# Portable to bash 3.2 (macOS) — no mapfile.
VIDEOS=()
while IFS= read -r line; do
  [ -n "$line" ] && VIDEOS+=("$line")
done < <(ls -tr test-results/*/video.webm 2>/dev/null || true)
if [ "${#VIDEOS[@]}" -eq 0 ]; then
  echo "No videos found under test-results/. Run the Playwright tests first."
  exit 1
fi

# Build a filter_complex that normalises each clip and concatenates them.
INPUTS=()
FILTER=""
CONCAT=""
i=0
for v in "${VIDEOS[@]}"; do
  INPUTS+=(-i "$v")
  FILTER+="[${i}:v]scale=1280:800:force_original_aspect_ratio=decrease,pad=1280:800:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25[v${i}];"
  CONCAT+="[v${i}]"
  i=$((i + 1))
done
FILTER+="${CONCAT}concat=n=${i}:v=1[outv]"

ffmpeg -y "${INPUTS[@]}" -filter_complex "$FILTER" -map "[outv]" \
  -c:v libx264 -pix_fmt yuv420p "$OUT_DIR/${PHASE}.mp4" >/dev/null 2>&1

echo "Wrote $OUT_DIR/${PHASE}.mp4 from ${i} clip(s)."
