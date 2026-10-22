/**
 * Convierte el .webm que graba Playwright (capturas/demo.config.ts) en el MP4
 * que publica el landing. Requiere ffmpeg en el PATH.
 *
 *   node capturas/video.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = process.cwd();
const ENTRADA_DIR = path.join(RAIZ, 'test-results-demo');
const SALIDA = path.join(RAIZ, 'public', 'demo', 'recorrido.mp4');

function buscarWebm(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return buscarWebm(p);
    return e.name.endsWith('.webm') ? [p] : [];
  });
}

const videos = buscarWebm(ENTRADA_DIR)
  .map((f) => ({ f, t: fs.statSync(f).mtimeMs }))
  .sort((a, b) => b.t - a.t);

if (videos.length === 0) {
  console.error(
    `No hay video en ${ENTRADA_DIR}. Corre primero:\n  npx playwright test -c capturas/demo.config.ts`,
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(SALIDA), { recursive: true });

execFileSync(
  'ffmpeg',
  [
    '-y',
    '-i', videos[0].f,
    '-an',
    '-vf', 'fps=25',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '26',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    SALIDA,
  ],
  { stdio: 'inherit' },
);

const mb = (fs.statSync(SALIDA).size / 1024 / 1024).toFixed(1);
console.log(`\nListo: public/demo/recorrido.mp4 (${mb} MB)`);
