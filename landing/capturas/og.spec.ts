import { test } from '@playwright/test';

/**
 * Imagen para compartir (WhatsApp, Twitter, LinkedIn): 1200×630.
 * Se genera aquí para que el texto siga la misma fuente de verdad que el sitio.
 */

const HTML = `<!doctype html>
<html lang="es-MX">
  <head><meta charset="utf-8" /></head>
  <body style="margin:0">
    <div style="
      width:1200px;height:630px;box-sizing:border-box;padding:72px;
      background:linear-gradient(135deg,#006d35 0%,#04281a 100%);
      color:#fff;display:flex;flex-direction:column;justify-content:space-between;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="display:flex;align-items:center;gap:18px">
        <svg width="56" height="56" viewBox="0 0 512 512">
          <rect width="512" height="512" rx="96" fill="#ffffff"></rect>
          <g fill="#006d35">
            <rect x="176" y="136" width="56" height="240" rx="12"></rect>
            <rect x="176" y="136" width="164" height="56" rx="12"></rect>
            <rect x="176" y="234" width="128" height="52" rx="12"></rect>
          </g>
        </svg>
        <span style="font-size:34px;font-weight:800;letter-spacing:-0.02em">Futcamedic</span>
      </div>

      <div>
        <h1 style="font-size:70px;line-height:1.05;letter-spacing:-0.03em;margin:0 0 24px;max-width:17ch;font-weight:800">
          Tu academia completa, sin cuadernos ni Excel
        </h1>
        <p style="font-size:30px;line-height:1.35;margin:0;color:#c9e3d5;max-width:30ch">
          Alumnos, asistencias, pagos y entrenamientos en un solo lugar.
        </p>
      </div>

      <div style="display:flex;align-items:center;gap:16px">
        <span style="background:#fff;color:#04281a;font-size:24px;font-weight:800;padding:12px 24px;border-radius:999px">
          Gratis durante la beta
        </span>
        <span style="font-size:24px;color:#a8cbb8">futcamedic.com</span>
      </div>
    </div>
  </body>
</html>`;

// 1× para que el PNG mida exactamente 1200×630, como declaran las metas og:image.
test.use({ deviceScaleFactor: 1 });

test('imagen para compartir', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(HTML);
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'public/og.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
});
