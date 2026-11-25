'use client';

import { Anchor, List, Modal, Stack, Table, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useModeloRiesgo } from '../../hooks/useRisk';

/**
 * Procedencia del número.
 *
 * Un aviso sin procedencia no se puede discutir, y este aviso se equivoca tres
 * de cada cuatro veces: decirlo aquí es parte de mostrarlo.
 */
export function ComoSeCalcula() {
  const [abierto, { open, close }] = useDisclosure(false);
  const { data: modelo } = useModeloRiesgo(abierto);

  return (
    <>
      <Anchor component="button" type="button" size="xs" onClick={open}>
        cómo se calcula
      </Anchor>

      <Modal opened={abierto} onClose={close} title="Cómo se calcula el aviso" centered size="lg">
        <Stack gap="sm">
          <Text size="sm">
            Es un árbol de decisión entrenado con las asistencias de la propia base. Mira el
            historial de cada alumno —faltas seguidas, días sin venir, cuántas sesiones lleva— y
            estima si faltará a la siguiente.
          </Text>

          {modelo && (
            <>
              <Table withRowBorders={false} verticalSpacing={4}>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>Entrenado el</Table.Td>
                    <Table.Td ta="right" fw={600}>
                      {modelo.version}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Con</Table.Td>
                    <Table.Td ta="right" fw={600}>
                      {modelo.entrenado_con.filas} filas · {modelo.entrenado_con.alumnos} alumnos
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Acierto (AUC en prueba)</Table.Td>
                    <Table.Td ta="right" fw={600}>
                      {modelo.metricas.auc_prueba.toFixed(3)}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Sin modelo, solo mirando su tasa de asistencia</Table.Td>
                    <Table.Td ta="right" fw={600}>
                      {modelo.metricas.referencia_tasa_previa.toFixed(3)}
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>

              <Text size="sm" fw={600}>
                Qué tan seguido se equivoca
              </Text>
              <List size="sm" spacing={4}>
                <List.Item>
                  De cada 4 alumnos señalados, {Math.round(modelo.metricas.precision_top25 * 4)}{' '}
                  falta de verdad.
                </List.Item>
                <List.Item>
                  De los que faltan, detecta aproximadamente{' '}
                  {Math.round(modelo.metricas.recall_top25 * 100)} %.
                </List.Item>
                <List.Item>
                  Señalar a quien marca es {modelo.metricas.lift_top25.toFixed(1)} veces mejor que
                  elegir al azar.
                </List.Item>
              </List>

              <Text size="xs" c="dimmed">
                El aviso sirve para llamar antes del entrenamiento, no para juzgar a nadie. La edad
                del alumno no se muestra como motivo aunque el modelo la use. Los padres y los
                alumnos nunca ven esto.
              </Text>
            </>
          )}
        </Stack>
      </Modal>
    </>
  );
}
