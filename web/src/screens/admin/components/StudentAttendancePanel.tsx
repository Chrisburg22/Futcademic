'use client';

import { useMemo, useState } from 'react';
import { Badge, Button, Card, Group, Progress, SegmentedControl, SimpleGrid, Skeleton, Table, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { useGetAttendancesByStudent } from '../../../hooks/useAttendances';
import { EmptyState } from '../../../components/common/EmptyState';

const TAMANO_PAGINA = 20;

type Registro = { id: string; date: string; type: string; present: boolean };

export function StudentAttendancePanel({ studentId }: { studentId: string }) {
  const { data, isLoading } = useGetAttendancesByStudent(studentId);
  const [tipo, setTipo] = useState('todos');
  const [visibles, setVisibles] = useState(TAMANO_PAGINA);

  const registros = useMemo(
    () =>
      ([...(data || [])] as Registro[]).sort(
        (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
      ),
    [data],
  );

  const filtrados = tipo === 'todos' ? registros : registros.filter((r) => r.type === tipo);
  const asistidos = filtrados.filter((r) => r.present).length;
  const porcentaje = filtrados.length ? Math.round((asistidos / filtrados.length) * 100) : 0;
  const color = porcentaje >= 80 ? 'green' : porcentaje >= 60 ? 'yellow' : 'red';

  if (isLoading) return <Skeleton height={220} radius="md" />;

  if (registros.length === 0) {
    return (
      <Card withBorder radius="md">
        <EmptyState
          title="Sin asistencias registradas"
          description="Aparecerán aquí cuando el profesor pase lista."
        />
      </Card>
    );
  }

  return (
    <Card withBorder padding={0} radius="md">
      <div style={{ padding: 'var(--mantine-spacing-md)' }}>
        <Group justify="space-between" mb="sm" wrap="wrap">
          <Text fw={600}>Historial de asistencia</Text>
          <SegmentedControl
            size="xs"
            value={tipo}
            onChange={(v) => {
              setTipo(v);
              setVisibles(TAMANO_PAGINA);
            }}
            data={[
              { value: 'todos', label: 'Todos' },
              { value: 'entrenamiento', label: 'Entrenamientos' },
              { value: 'partido', label: 'Partidos' },
            ]}
          />
        </Group>
        <SimpleGrid cols={3} mb="sm">
          <div>
            <Text size="xs" c="dimmed">
              Asistencia
            </Text>
            <Text fw={700} size="xl" c={color}>
              {porcentaje}%
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Asistió
            </Text>
            <Text fw={700} size="xl">
              {asistidos}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Faltó
            </Text>
            <Text fw={700} size="xl">
              {filtrados.length - asistidos}
            </Text>
          </div>
        </SimpleGrid>
        <Progress value={porcentaje} color={color} size="sm" aria-label={`Asistencia ${porcentaje}%`} />
      </div>
      {filtrados.length === 0 ? (
        <Text p="md" c="dimmed" size="sm">
          Sin registros de este tipo.
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={360}>
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Asistencia</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtrados.slice(0, visibles).map((a) => (
                <Table.Tr key={a.id}>
                  <Table.Td>{dayjs(a.date).format('DD/MM/YYYY')}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm" tt="capitalize">
                      {a.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={a.present ? 'green' : 'red'} variant="light" size="sm">
                      {a.present ? 'Asistió' : 'Faltó'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
      {filtrados.length > visibles && (
        <Group justify="center" p="sm">
          <Button variant="subtle" onClick={() => setVisibles((v) => v + TAMANO_PAGINA)}>
            Ver más ({filtrados.length - visibles} restantes)
          </Button>
        </Group>
      )}
    </Card>
  );
}
