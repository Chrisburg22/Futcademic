'use client';

import { Alert, Badge, Card, Group, SimpleGrid, Skeleton, Stack, Table, Text } from '@mantine/core';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useGetAccountStatement } from '../../../hooks/usePayments';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatearMensualidad } from '../../../lib/categories';
import { normalizarEstado } from '../../../lib/students';

type Props = { studentId: string; estado?: string | null };

function Dato({ titulo, valor, color }: { titulo: string; valor: string; color?: string }) {
  return (
    <Card withBorder padding="md" radius="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {titulo}
      </Text>
      <Text fw={700} size="xl" c={color} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {valor}
      </Text>
    </Card>
  );
}

export function StudentPaymentsPanel({ studentId, estado }: Props) {
  const { data, isLoading, isError } = useGetAccountStatement(studentId);
  const becado = normalizarEstado(estado) === 'becado';

  if (isLoading) {
    return (
      <Stack>
        <Skeleton height={80} radius="md" />
        <Skeleton height={160} radius="md" />
      </Stack>
    );
  }
  if (isError || !data) {
    return (
      <Alert color="red" icon={<IconAlertCircle size={16} />}>
        No se pudo cargar el estado de cuenta.
      </Alert>
    );
  }

  const movimientos: { date: string; amount: number; description: string }[] = data.movements || [];
  const debe = Number(data.pendingAmount) > 0 && !becado;

  return (
    <Stack>
      {becado ? (
        <Alert color="violet" variant="light" icon={<IconCircleCheck size={16} />}>
          Alumno becado: no genera deuda de mensualidad.
        </Alert>
      ) : debe ? (
        <Alert color="orange" variant="light" icon={<IconAlertCircle size={16} />}>
          Debe {formatearMensualidad(data.pendingAmount)} de la mensualidad de este mes.
          Registra el pago desde Finanzas.
        </Alert>
      ) : (
        <Alert color="green" variant="light" icon={<IconCircleCheck size={16} />}>
          La mensualidad de este mes está al corriente.
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, xs: 3 }}>
        <Dato titulo="Mensualidad" valor={formatearMensualidad(data.monthlyFee)} />
        <Dato
          titulo="Pendiente este mes"
          valor={becado ? '—' : formatearMensualidad(data.pendingAmount)}
          color={debe ? 'orange' : undefined}
        />
        <Dato titulo="Total pagado" valor={formatearMensualidad(data.totalPaid)} />
      </SimpleGrid>

      <Card withBorder padding={0} radius="md">
        <Group justify="space-between" p="md" pb="xs">
          <Text fw={600}>Movimientos</Text>
          <Badge variant="light" color="gray">
            {data.totalPayments} {data.totalPayments === 1 ? 'pago' : 'pagos'}
          </Badge>
        </Group>
        {movimientos.length === 0 ? (
          <EmptyState title="Sin pagos registrados" description="Cuando se cobre una mensualidad aparecerá aquí." />
        ) : (
          <Table.ScrollContainer minWidth={380}>
            <Table verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Concepto</Table.Th>
                  <Table.Th ta="right">Monto</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {movimientos.map((m, i) => (
                  <Table.Tr key={`${m.date}-${i}`}>
                    <Table.Td>{dayjs(m.date).format('DD/MM/YYYY')}</Table.Td>
                    <Table.Td>{m.description}</Table.Td>
                    <Table.Td ta="right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatearMensualidad(m.amount)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>
    </Stack>
  );
}
