'use client';

import {
  Anchor,
  Card,
  Code,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useState } from 'react';
import { ETIQUETA_ACCION, useBitacora } from '../../hooks/usePlatform';

/** Todo lo que el dueño hizo sobre la academia de otra persona, con su motivo. */
export function PlatformAuditPage() {
  const [action, setAction] = useState<string | null>(null);
  const { data = [], isLoading } = useBitacora({ action: action || undefined });

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Bitácora</Title>
        <Text size="sm" c="dimmed">
          Cada suspensión, reactivación y edición hecha desde esta consola.
        </Text>
      </div>

      <Select
        placeholder="Todas las acciones"
        clearable
        w={260}
        value={action}
        onChange={setAction}
        data={Object.entries(ETIQUETA_ACCION).map(([value, label]) => ({ value, label }))}
      />

      <Card withBorder radius="md" padding={0}>
        {isLoading ? (
          <Group p="md">
            <Loader size="sm" />
          </Group>
        ) : data.length === 0 ? (
          <Text p="md" size="sm" c="dimmed">
            Nada registrado todavía.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={760}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Cuándo</Table.Th>
                  <Table.Th>Quién</Table.Th>
                  <Table.Th>Qué</Table.Th>
                  <Table.Th>Academia</Table.Th>
                  <Table.Th>Motivo</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.map((l) => (
                  <Table.Tr key={l.id}>
                    <Table.Td>
                      <Text size="sm">{dayjs(l.created_at).format('DD/MM/YY HH:mm')}</Text>
                      {l.ip && (
                        <Code fz={10} c="dimmed">
                          {l.ip}
                        </Code>
                      )}
                    </Table.Td>
                    <Table.Td>{l.actor?.full_name || '—'}</Table.Td>
                    <Table.Td>{ETIQUETA_ACCION[l.action] || l.action}</Table.Td>
                    <Table.Td>
                      {l.school_id ? (
                        <Anchor component={Link} href={`/platform/schools/${l.school_id}`} size="sm">
                          {l.school?.name || l.school_id.slice(0, 8)}
                        </Anchor>
                      ) : (
                        '—'
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {l.payload?.reason ? String(l.payload.reason) : '—'}
                      </Text>
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
