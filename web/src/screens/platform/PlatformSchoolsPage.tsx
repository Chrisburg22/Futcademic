'use client';

import {
  Anchor,
  Badge,
  Card,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useState } from 'react';
import { useEscuelas, type EscuelaFila } from '../../hooks/usePlatform';

export const COLOR_ESTADO: Record<string, string> = {
  activa: 'green',
  suspendida: 'red',
  archivada: 'gray',
};

/** El dato que decide a quién llamar: cuántos días lleva sin registrar nada. */
export function Inactividad({ escuela }: { escuela: EscuelaFila }) {
  if (escuela.last_activity_at === null) {
    return (
      <Text size="sm" c="dimmed">
        nunca
      </Text>
    );
  }
  const dias = escuela.dias_sin_actividad ?? 0;
  const color = dias >= 14 ? 'orange' : dias >= 30 ? 'red' : undefined;
  return (
    <Text size="sm" c={color} fw={color ? 600 : undefined}>
      {dias === 0 ? 'hoy' : `hace ${dias} d`}
    </Text>
  );
}

export function PlatformSchoolsPage() {
  const [texto, setTexto] = useState('');
  const [q] = useDebouncedValue(texto, 250);
  const [status, setStatus] = useState<string | null>(null);
  const [orden, setOrden] = useState<string>('actividad');

  const { data = [], isLoading } = useEscuelas({
    q: q || undefined,
    status: status || undefined,
    orden,
  });

  return (
    <Stack gap="md">
      <Title order={2}>Academias</Title>

      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder="Buscar por nombre"
          leftSection={<IconSearch size={16} />}
          value={texto}
          onChange={(e) => setTexto(e.currentTarget.value)}
          w={240}
        />
        <Select
          placeholder="Todos los estados"
          clearable
          w={170}
          value={status}
          onChange={setStatus}
          data={[
            { value: 'activa', label: 'Activas' },
            { value: 'suspendida', label: 'Suspendidas' },
            { value: 'archivada', label: 'Archivadas' },
          ]}
        />
        <Select
          w={200}
          value={orden}
          onChange={(v) => setOrden(v || 'actividad')}
          data={[
            { value: 'actividad', label: 'Más tiempo sin actividad' },
            { value: 'alumnos', label: 'Más alumnos' },
            { value: 'creada', label: 'Más recientes' },
            { value: 'nombre', label: 'Nombre' },
          ]}
        />
      </Group>

      <Card withBorder radius="md" padding={0}>
        {isLoading ? (
          <Group p="md">
            <Loader size="sm" />
          </Group>
        ) : data.length === 0 ? (
          <Text p="md" c="dimmed" size="sm">
            Ninguna academia coincide.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={760}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Academia</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th ta="right">Alumnos</Table.Th>
                  <Table.Th ta="right">Usuarios</Table.Th>
                  <Table.Th ta="right">Categorías</Table.Th>
                  <Table.Th>Última actividad</Table.Th>
                  <Table.Th>Creada</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.map((e) => (
                  <Table.Tr key={e.id}>
                    <Table.Td>
                      <Anchor component={Link} href={`/platform/schools/${e.id}`} fw={500}>
                        {e.name}
                      </Anchor>
                      {e.contacto_email && (
                        <Text size="xs" c="dimmed">
                          {e.contacto_email}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={COLOR_ESTADO[e.status]}>
                        {e.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td ta="right">{e.students}</Table.Td>
                    <Table.Td ta="right">{e.users}</Table.Td>
                    <Table.Td ta="right">{e.categories}</Table.Td>
                    <Table.Td>
                      <Inactividad escuela={e} />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {e.created_at ? dayjs(e.created_at).format('DD/MM/YY') : '—'}
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
