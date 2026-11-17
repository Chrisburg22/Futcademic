import { test, expect, type Page } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Red de seguridad del suelo táctil (44 px) en teléfono.
 *
 * Mide lo que el dedo apunta de verdad: botones, enlaces y la raíz de los
 * controles de Mantine (no el cuadro interno del checkbox, que es decorativo).
 * La lista de EXCEPCIONES arranca poblada y **se vacía fase a fase**: cada
 * entrada dice qué fase la retira. Si una excepción deja de hacer falta, el
 * test avisa, así que no se queda ahí para siempre.
 */

const PHONE = { width: 390, height: 844 };
const MINIMO = 44;

type Objetivo = { nombre: string; etiqueta: string; clases: string; alto: number; ancho: number };

/** Cada entrada se retira en la fase indicada. */
const EXCEPCIONES: { patron: RegExp; motivo: string }[] = [
];

const CATEGORIAS = [
  { id: 'c1', name: 'Sub-12', birth_year: '2014', color: '#1971c2' },
  { id: 'c2', name: 'Sub-14', birth_year: '2012', color: '#c2255c' },
];

const ALUMNOS = Array.from({ length: 8 }, (_, i) => ({
  id: `s${i + 1}`,
  full_name: `Alumno ${String(i + 1).padStart(2, '0')} Pérez`,
  birth_date: '2014-03-10',
  category_id: 'c1',
  category: CATEGORIAS[0],
  parent_id: 'p1',
  parent: { id: 'p1', full_name: 'María López', phone: '55 1234 5678' },
  status: i === 0 ? 'pendiente_pago' : 'activo',
  uniform_delivered: i % 2 === 0,
  expediente_status: i === 1 ? 'incompleto' : 'completo',
  expediente_missing: i === 1 ? ['curp'] : [],
  created_at: '2026-01-10T10:00:00Z',
}));

const DASHBOARDS = {
  admin: { activeStudents: 8, totalStudents: 8, monthlyIncome: 4000, attendanceRate: 90 },
};

async function medir(page: Page): Promise<Objetivo[]> {
  return page.evaluate((minimo) => {
    const selector = [
      'button',
      'a[href]',
      '[role="button"]',
      '.mantine-Checkbox-root',
      '.mantine-Radio-root',
      '.mantine-Switch-root',
    ].join(', ');

    const fuera: Objetivo[] = [];
    for (const el of Array.from(document.querySelectorAll(selector))) {
      if (el.closest('[aria-hidden="true"]')) continue;
      const estilo = getComputedStyle(el);
      if (estilo.visibility === 'hidden' || estilo.display === 'none' || estilo.opacity === '0') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Un control que ya contiene otro control se mide por el de dentro.
      if (el.querySelector(selector)) continue;
      if (r.height < minimo || r.width < minimo) {
        fuera.push({
          nombre: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
          etiqueta: el.tagName.toLowerCase(),
          clases: String((el as HTMLElement).className || '').slice(0, 140),
          alto: Math.round(r.height),
          ancho: Math.round(r.width),
        });
      }
    }
    return fuera;
  }, MINIMO) as Promise<Objetivo[]>;
}

function sinExcepciones(objetivos: Objetivo[]) {
  return objetivos.filter(
    (o) => !EXCEPCIONES.some(({ patron }) => patron.test(o.nombre) || patron.test(o.clases)),
  );
}

const describir = (objetivos: Objetivo[]) =>
  objetivos.map((o) => `  · ${o.ancho}×${o.alto} ${o.etiqueta} «${o.nombre}» [${o.clases}]`).join('\n');

const RUTAS_ADMIN = ['/', '/admin/students'];

for (const ruta of RUTAS_ADMIN) {
  test(`toque de 44 px en ${ruta} (admin)`, async ({ page }) => {
    await page.setViewportSize(PHONE);
    await loginAs(page, {
      goto: ruta,
      api: {
        students: ALUMNOS,
        categories: CATEGORIAS,
        dashboards: DASHBOARDS,
        pendingPayments: [{ id: 's1', full_name: ALUMNOS[0].full_name, monthly_fee: 500, paid_amount: 0, pending_amount: 500 }],
        users: [{ id: 'p1', full_name: 'María López', role: 'padre' }],
      },
    });
    // Esperar a que la pantalla asiente antes de medir.
    await page.locator('header').waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');

    const pequenos = sinExcepciones(await medir(page));
    expect(pequenos, `Objetivos por debajo de ${MINIMO} px en ${ruta}:\n${describir(pequenos)}`).toEqual([]);
  });
}
