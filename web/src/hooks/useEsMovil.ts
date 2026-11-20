'use client';

import { useMediaQuery } from '@mantine/hooks';

/**
 * Único punto de verdad para «estamos en teléfono» cuando el CSS no basta.
 *
 * `initialValue: false` + `getInitialValueInEffect: false` evitan el `undefined`
 * del primer render, que es lo que hacía que la lista de alumnos pintara
 * primero la tabla de escritorio (960 px de ancho mínimo) y luego saltara a
 * tarjetas, con parpadeo y desbordamiento horizontal de propina.
 *
 * Devuelve `false` en el servidor, así que la rama que se hidrata es la de
 * escritorio: **usar solo donde eso sea inocuo**, es decir para contenido que
 * aparece tras una interacción (un sheet, un popover). Para maquetación van
 * `visibleFrom`/`hiddenFrom` de Mantine o media queries en CSS Modules, que se
 * resuelven en el primer pintado.
 */
export function useEsMovil(): boolean {
  return useMediaQuery('(max-width: 48em)', false, { getInitialValueInEffect: false }) ?? false;
}
