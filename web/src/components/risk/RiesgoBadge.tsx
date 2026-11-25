'use client';

import { Badge, Tooltip } from '@mantine/core';
import { COLOR_BANDA, type RiesgoAlumno } from '../../hooks/useRisk';

/**
 * La banda, no la probabilidad. El profesor necesita saber a quién llamar, no
 * un porcentaje que no puede verificar.
 */
export function RiesgoBadge({ riesgo, compacto }: { riesgo: RiesgoAlumno; compacto?: boolean }) {
  if (riesgo.status === 'sin_historial') {
    return (
      <Tooltip label="Necesita al menos dos sesiones registradas para estimar algo">
        <Badge variant="light" color="gray" size={compacto ? 'xs' : 'sm'}>
          sin historial
        </Badge>
      </Tooltip>
    );
  }

  if (riesgo.status === 'inactivo') {
    return (
      <Tooltip label="Nunca ha asistido: conviene revisar si sigue inscrito">
        <Badge variant="light" color="gray" size={compacto ? 'xs' : 'sm'}>
          nunca asistió
        </Badge>
      </Tooltip>
    );
  }

  if (riesgo.band === 'bajo') return null;

  return (
    <Tooltip label={riesgo.reasons.map((m) => m.text).join(' · ') || 'Puede faltar'}>
      <Badge variant="light" color={COLOR_BANDA[riesgo.band || 'bajo']} size={compacto ? 'xs' : 'sm'}>
        {riesgo.band === 'alto' ? 'puede faltar' : 'ojo'}
      </Badge>
    </Tooltip>
  );
}
