import { useMemo } from 'react';
import { Accordion, Badge, Group, Progress, Stack, Table, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { useGetAttendancesByCategory } from '../../hooks/useAttendances';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';

type SessionGroup = {
  key: string;
  date: string;
  type: string;
  records: any[];
  present: number;
  total: number;
};

/** Histórico de asistencias de una categoría, agrupado por sesión (fecha + tipo). */
export function CategoryAttendanceHistory({ categoryId }: { categoryId: string }) {
  const { data: attendances = [], isLoading } = useGetAttendancesByCategory(categoryId);

  const sessions: SessionGroup[] = useMemo(() => {
    const groups = new Map<string, SessionGroup>();
    for (const a of attendances) {
      const key = `${a.date}|${a.type}`;
      if (!groups.has(key)) {
        groups.set(key, { key, date: a.date, type: a.type, records: [], present: 0, total: 0 });
      }
      const g = groups.get(key)!;
      g.records.push(a);
      g.total += 1;
      if (a.present) g.present += 1;
    }
    return [...groups.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [attendances]);

  if (isLoading) return <LoadingState />;
  if (sessions.length === 0)
    return <EmptyState description="Sin asistencias registradas para esta categoría." />;

  return (
    <Accordion variant="separated" radius="md">
      {sessions.map((s) => {
        const pct = s.total ? Math.round((s.present / s.total) * 100) : 0;
        return (
          <Accordion.Item key={s.key} value={s.key}>
            <Accordion.Control>
              <Group justify="space-between" wrap="nowrap" pr="md">
                <Group gap="xs">
                  <Text fw={500} size="sm">
                    {dayjs(s.date).format('DD MMM YYYY')}
                  </Text>
                  <Badge variant="light" tt="capitalize">
                    {s.type}
                  </Badge>
                </Group>
                <Group gap="xs" wrap="nowrap" w={180}>
                  <Progress value={pct} w={80} color={pct >= 70 ? 'green' : pct >= 40 ? 'yellow' : 'red'} />
                  <Text size="xs" c="dimmed" w={90}>
                    {s.present}/{s.total} ({pct}%)
                  </Text>
                </Group>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap={0}>
                <Table verticalSpacing={6}>
                  <Table.Tbody>
                    {s.records
                      .slice()
                      .sort((a: any, b: any) =>
                        (a.student?.full_name || '').localeCompare(b.student?.full_name || ''),
                      )
                      .map((r: any) => (
                        <Table.Tr key={r.id}>
                          <Table.Td>
                            <Text size="sm">{r.student?.full_name || '—'}</Text>
                          </Table.Td>
                          <Table.Td w={110} align="right">
                            <Badge variant="light" color={r.present ? 'green' : 'red'}>
                              {r.present ? 'Presente' : 'Ausente'}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
