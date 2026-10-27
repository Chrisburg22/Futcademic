import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  MultiSelect,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconEye, IconUserMinus, IconUserPlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useGetStudents, useUpdateStudent } from '../../../hooks/useStudents';
import { useAssignTeacher, useUnassignTeacher } from '../../../hooks/useCategories';
import { useGetTeachers } from '../../../hooks/useUsers';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingState } from '../../../components/common/LoadingState';
import { estaLlena, mensajeDeError } from '../../../lib/categories';
import type { CategoryDetail } from '../../../types';

/**
 * Plantel de la categoría. Mover un alumno es un `PUT /students/:id` con el
 * `category_id` nuevo, el mismo camino que usa la ficha del alumno, así que no
 * hace falta un endpoint de lote.
 */
export function CategoryStudentsPanel({
  category,
  puedeGestionar,
}: {
  category: CategoryDetail;
  puedeGestionar: boolean;
}) {
  const navigate = useRouter();
  const { data: enLaCategoria = [], isLoading } = useGetStudents(category.id);
  const { data: todos = [] } = useGetStudents();
  const actualizarAlumno = useUpdateStudent();
  const [abierto, { open, close }] = useDisclosure(false);
  const [seleccion, setSeleccion] = useState<string[]>([]);

  const disponibles = useMemo(
    () => todos.filter((s: any) => s.category_id !== category.id),
    [todos, category.id],
  );

  const llena = estaLlena({
    students_count: enLaCategoria.length,
    max_students: category.max_students,
  });

  const asignar = async () => {
    const resultados = await Promise.allSettled(
      seleccion.map((id) => actualizarAlumno.mutateAsync({ id, category_id: category.id })),
    );
    const fallidos = resultados.filter((r) => r.status === 'rejected').length;
    const hechos = resultados.length - fallidos;

    notifications.show({
      color: fallidos === 0 ? 'green' : 'yellow',
      message:
        fallidos === 0
          ? `${hechos} jugador${hechos === 1 ? '' : 'es'} asignado${hechos === 1 ? '' : 's'}`
          : `${hechos} asignados, ${fallidos} con error`,
    });

    setSeleccion([]);
    if (fallidos === 0) close();
  };

  const confirmarQuitar = (alumno: any) =>
    modals.openConfirmModal({
      title: 'Quitar de la categoría',
      children: (
        <Text size="sm">
          {alumno.full_name} se quedará sin categoría. Su historial de asistencias y pagos no se
          toca.
        </Text>
      ),
      labels: { confirm: 'Quitar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await actualizarAlumno.mutateAsync({ id: alumno.id, category_id: null });
          notifications.show({ color: 'green', message: 'Jugador quitado de la categoría' });
        } catch (e: any) {
          notifications.show({
            color: 'red',
            message: mensajeDeError(e, 'Error al quitar al jugador'),
          });
        }
      },
    });

  if (isLoading) return <LoadingState />;

  return (
    <Stack>
      <Group justify="space-between" wrap="wrap">
        <Group gap="xs">
          <Badge variant="light">
            {enLaCategoria.length}
            {category.max_students ? ` / ${category.max_students}` : ''} jugadores
          </Badge>
          {llena && (
            <Badge variant="light" color="orange">
              Aforo completo
            </Badge>
          )}
        </Group>
        {puedeGestionar && (
          <Button
            variant="light"
            leftSection={<IconUserPlus size={16} />}
            onClick={open}
            disabled={disponibles.length === 0}
          >
            Asignar jugadores
          </Button>
        )}
      </Group>

      {enLaCategoria.length === 0 ? (
        <EmptyState
          title="Sin jugadores"
          description="Esta categoría todavía no tiene plantel."
          icon={<IconUserPlus size={32} />}
          action={
            puedeGestionar && disponibles.length > 0 ? (
              <Button variant="light" onClick={open}>
                Asignar jugadores
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card withBorder padding={0} radius="md">
          <Table.ScrollContainer minWidth={500}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Jugador</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {enLaCategoria.map((s: any) => (
                  <Table.Tr key={s.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" radius="xl" src={s.avatar_url || undefined}>
                          {s.full_name?.[0]?.toUpperCase()}
                        </Avatar>
                        <div>
                          <Text size="sm" fw={500}>
                            {s.full_name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {s.email}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" tt="capitalize">
                        {s.status || 'activo'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end" wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => navigate.push(`/admin/students/${s.id}`)}
                          aria-label="Ver detalle"
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        {puedeGestionar && (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => confirmarQuitar(s)}
                            aria-label="Quitar de la categoría"
                          >
                            <IconUserMinus size={16} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>
      )}

      <Modal opened={abierto} onClose={close} title="Asignar jugadores" centered>
        <Stack>
          {llena && (
            <Alert color="orange" variant="light">
              La categoría ya alcanzó su aforo de {category.max_students} jugadores.
            </Alert>
          )}
          <MultiSelect
            label="Jugadores"
            description="Se moverán a esta categoría desde la que tengan ahora"
            placeholder="Busca por nombre"
            data={disponibles.map((s: any) => ({
              value: s.id,
              label: s.category_id ? `${s.full_name} (cambia de categoría)` : s.full_name,
            }))}
            value={seleccion}
            onChange={setSeleccion}
            searchable
            clearable
            maxDropdownHeight={260}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancelar
            </Button>
            <Button
              loading={actualizarAlumno.isPending}
              disabled={seleccion.length === 0}
              onClick={asignar}
            >
              Asignar {seleccion.length || ''}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

/** Cuerpo técnico de la categoría. */
export function CategoryCoachesPanel({
  category,
  puedeGestionar,
}: {
  category: CategoryDetail;
  puedeGestionar: boolean;
}) {
  const { data: teachers = [] } = useGetTeachers();
  const asignar = useAssignTeacher();
  const quitar = useUnassignTeacher();
  const [seleccion, setSeleccion] = useState<string | null>(null);

  const asignados = category.all_teachers || [];
  const disponibles = teachers.filter(
    (t: any) => !asignados.some((a) => a.id === t.id),
  );

  const asignarProfesor = async () => {
    if (!seleccion) return;
    try {
      await asignar.mutateAsync({ categoryId: category.id, teacher_id: seleccion });
      notifications.show({ color: 'green', message: 'Entrenador asignado' });
      setSeleccion(null);
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: mensajeDeError(e, 'Error al asignar al entrenador'),
      });
    }
  };

  const quitarProfesor = async (id: string, nombre?: string | null) => {
    try {
      await quitar.mutateAsync({ categoryId: category.id, teacherId: id });
      notifications.show({
        color: 'green',
        message: `${nombre || 'Entrenador'} ya no está en la categoría`,
      });
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: mensajeDeError(e, 'Error al quitar al entrenador'),
      });
    }
  };

  return (
    <Stack>
      {puedeGestionar && (
        <Card withBorder padding="md" radius="md">
          <Group align="flex-end" wrap="wrap">
            <MultiSelect
              label="Añadir entrenador"
              placeholder={disponibles.length ? 'Selecciona un profesor' : 'Sin profesores libres'}
              data={disponibles.map((t: any) => ({ value: t.id, label: t.full_name }))}
              value={seleccion ? [seleccion] : []}
              onChange={(valores) => setSeleccion(valores[valores.length - 1] || null)}
              searchable
              disabled={disponibles.length === 0}
              style={{ flex: '1 1 240px' }}
            />
            <Button
              leftSection={<IconUserPlus size={16} />}
              loading={asignar.isPending}
              disabled={!seleccion}
              onClick={asignarProfesor}
            >
              Asignar
            </Button>
          </Group>
        </Card>
      )}

      {asignados.length === 0 ? (
        <EmptyState
          title="Sin entrenadores"
          description="Asigna al menos un entrenador para que pueda pasar lista."
          icon={<IconUserPlus size={32} />}
        />
      ) : (
        <Card withBorder padding={0} radius="md">
          <Table verticalSpacing="sm">
            <Table.Tbody>
              {asignados.map((t) => (
                <Table.Tr key={t.id}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar size="sm" radius="xl">
                        {t.full_name?.[0]?.toUpperCase() || '?'}
                      </Avatar>
                      <Text size="sm" fw={500}>
                        {t.full_name || 'Sin nombre'}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {puedeGestionar && (
                      <Group justify="flex-end">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => quitarProfesor(t.id, t.full_name)}
                          aria-label="Quitar entrenador"
                        >
                          <IconUserMinus size={16} />
                        </ActionIcon>
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
}
