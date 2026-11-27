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
import { useUsuariosPlataforma } from '../../hooks/usePlatform';

/**
 * Buscador de personas para soporte: contesta «no puedo entrar» sin abrir la
 * base. Solo lectura: no muestra ni cambia contraseñas.
 */
export function PlatformUsersPage() {
  const [texto, setTexto] = useState('');
  const [q] = useDebouncedValue(texto, 250);
  const [role, setRole] = useState<string | null>(null);

  const { data = [], isLoading } = useUsuariosPlataforma({
    q: q || undefined,
    role: role || undefined,
  });

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Personas</Title>
        <Text size="sm" c="dimmed">
          Los 50 más recientes, o los que coincidan con la búsqueda.
        </Text>
      </div>

      <Group gap="sm">
        <TextInput
          placeholder="Buscar por nombre"
          leftSection={<IconSearch size={16} />}
          value={texto}
          onChange={(e) => setTexto(e.currentTarget.value)}
          w={260}
        />
        <Select
          placeholder="Todos los roles"
          clearable
          w={180}
          value={role}
          onChange={setRole}
          data={['plataforma', 'super_admin', 'admin', 'profesor', 'padre', 'alumno'].map((r) => ({
            value: r,
            label: r.replace('_', ' '),
          }))}
        />
      </Group>

      <Card withBorder radius="md" padding={0}>
        {isLoading ? (
          <Group p="md">
            <Loader size="sm" />
          </Group>
        ) : data.length === 0 ? (
          <Text p="md" size="sm" c="dimmed">
            Nadie coincide.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={700}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Rol</Table.Th>
                  <Table.Th>Academia</Table.Th>
                  <Table.Th>Estado de la cuenta</Table.Th>
                  <Table.Th>Alta</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.map((u) => (
                  <Table.Tr key={u.id}>
                    <Table.Td>{u.full_name || '—'}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={u.role === 'plataforma' ? 'dark' : 'blue'}>
                        {u.role.replace('_', ' ')}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {u.school_id ? (
                        <Anchor component={Link} href={`/platform/schools/${u.school_id}`} size="sm">
                          {u.school?.name || u.school_id.slice(0, 8)}
                        </Anchor>
                      ) : (
                        <Text size="sm" c="dimmed">
                          —
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {u.must_change_password ? (
                        <Badge variant="light" color="orange">
                          contraseña temporal
                        </Badge>
                      ) : !u.onboarded_at && u.role !== 'plataforma' ? (
                        <Badge variant="light" color="gray">
                          sin completar perfil
                        </Badge>
                      ) : (
                        <Badge variant="light" color="green">
                          lista
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {u.created_at ? dayjs(u.created_at).format('DD/MM/YY') : '—'}
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
