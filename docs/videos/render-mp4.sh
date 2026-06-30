#!/usr/bin/env bash
# render-mp4.sh — Convierte los 5 HTML de Futcamedic a MP4
# Requisitos: hyperframes CLI (npx hyperframes) + ffmpeg
# Uso: cd docs/videos && bash render-mp4.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/mp4"
WORK_DIR="$SCRIPT_DIR/.render-tmp"
mkdir -p "$OUT_DIR" "$WORK_DIR"

VIDEOS=(
  "video1-crear-alumno"
  "video2-login-alumno"
  "video3-pase-lista"
  "video4-alumno-modulo"
  "video5-eventos"
)

echo ""
echo "🎬  Futcamedic — Render MP4"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for name in "${VIDEOS[@]}"; do
  HTML="$SCRIPT_DIR/${name}.html"
  PROJ_DIR="$WORK_DIR/${name}"
  FINAL_MP4="$OUT_DIR/${name}.mp4"

  echo "▶  Renderizando: $name"

  # Cada video necesita su propio directorio con index.html
  mkdir -p "$PROJ_DIR"
  cp "$HTML" "$PROJ_DIR/index.html"

  # Render con hyperframes
  npx hyperframes render "$PROJ_DIR" \
    --output "$FINAL_MP4" \
    --fps 30 \
    --quality high \
    --quiet \
    2>&1 | grep -v "^$" || true

  SIZE=$(du -sh "$FINAL_MP4" 2>/dev/null | cut -f1 || echo "?")
  echo "   ✓  $(basename "$FINAL_MP4")  ($SIZE)"
  echo ""
done

# Limpieza
rm -rf "$WORK_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  5 videos MP4 listos en: $OUT_DIR"
echo ""
ls -lh "$OUT_DIR"/*.mp4
