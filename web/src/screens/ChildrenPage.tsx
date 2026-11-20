'use client';

import { useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Collapse,
  Group,
  Menu,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import {
  IconChevronDown,
  IconChevronUp,
  IconDotsVertical,
  IconPlus,
  IconUnlink,
} from '@tabler/icons-react';
import { useGetMyChildren, useGetStudentTeam } from '../hooks/useStudents';
import { useLinkChild, useUnlinkChild } from '../hooks/useParents';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SkeletonPage } from '../components/common/SkeletonPage';
import { TouchRow } from '../components/common/TouchRow';
import { BottomSheet } from '../components/common/BottomSheet';
import { CategorySummary } from '../components/categories/CategorySummary';
import { mensajeDeError } from '../lib/categories';
import { ESTADOS_ALUMNO, normalizarEstado } from '../lib/students';

/**
 * Ficha de la categoría del hijo. Reutiliza `GET /students/:id/team`, el mismo
 * endpoint que alimenta "Mi equipo" del alumno; el padre solo lo ve en lectura.
 */
function CategoriaDelHijo({ studentId }: { studentId: string }) {
  const [abierto, { toggle }] = useDisclosure(false);
  const { data: team, isLoading } = useGetStudentTeam(abierto ? studentId : undefined);

  return (
    <Stack gap="xs" mt="xs" w="100%">
      <Button
        variant="subtle"
        style={{ alignSelf: 'flex-start' }}
        rightSection={abierto ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        onClick={toggle}
      >
        {abierto ? 'Ocultar horario' : 'Ver horario y cancha'}
      </Button>
      <Collapse in={abierto}>
        {isLoading ? (
          <Skeleton height={140} radius="md" />
        ) : !team ? (
          <Text size="sm" c="dimmed">
            Todavía no está asignado a una categoría.
          </Text>
        ) : (
          <CategorySummary
            nombre={team.teamName || 'Categoría'}
            color={team.color}
            anios={team.birthYear ? String(team.birthYear) : undefined}
            jugadores={team.totalTeammates}
            entrenadores={(team.teachers || []).map((t: any) => ({
              id: t.id,
              nombre: t.name,
              avatar: t.avatar,
            }))}
            horario={(team.schedules || []).map((s: any) => ({
              id: s.id,
              nombre: s.name,
              hora: s.time,
              cancha: s.venue,
            }))}
          />
        )}
      </Collapse>
    </Stack>
  );
}

export function ChildrenPage() {
  const { data: children = [], isLoading, isError, refetch } = useGetMyChildren();
  const link = useLinkChild();
  const unlink = useUnlinkChild();
  const [abierto, setAbierto] = useState(false);

  const form = useForm({
    initialValues: { student_code: '', full_name: '' },
  });

  const onLink = async (v: typeof form.values) => {
    try {
      await link.mutateAsync({
        student_code: v.student_code || undefined,
        full_name: v.full_name || undefined,
      });
      notifications.show({ color: 'green', message: 'Hijo vinculado' });
      form.reset();
      setAbierto(false);
    } catch (e) {
      // Antes solo había aviso de éxito: un fallo dejaba el formulario mudo.
      notifications.show({ color: 'red', message: mensajeDeError(e, 'No se pudo vincular') });
    }
  };

  const confirmUnlink = (child: any) =>
    modals.openConfirmModal({
      title: 'Desvincular hijo',
      children: <Text size="sm">¿Desvincular a {child.full_name} de tu cuenta?</Text>,
      labels: { confirm: 'Desvincular', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await unlink.mutateAsync(child.id);
          notifications.show({ color: 'green', message: 'Hijo desvinculado' });
        } catch (e) {
          notifications.show({
            color: 'red',
            message: mensajeDeError(e, 'No se pudo desvincular'),
          });
        }
      },
    });

  const nuevo = (
    <Button leftSection={<IconPlus size={18} />} onClick={() => setAbierto(true)}>
      Vincular hijo
    </Button>
  );

  return (
    <>
      <PageHeader title="Mis hijos" actions={nuevo} />

      {isError ? (
        <ErrorState title="No pudimos cargar a tus hijos" onRetry={() => refetch()} />
      ) : isLoading ? (
        <SkeletonPage rows={2} heroHeight={80} />
      ) : children.length === 0 ? (
        <EmptyState
          title="Sin hijos vinculados"
          description="Vincula a tu hijo con el código que te dio la academia."
          action={nuevo}
        />
      ) : (
        <Stack gap="xs">
          {(children as any[]).map((c) => (
            <Stack key={c.id} gap={0}>
              <TouchRow
                leading={
                  <Avatar src={c.avatar_url || undefined} size={48} radius="xl">
                    {c.full_name?.[0]?.toUpperCase()}
                  </Avatar>
                }
                title={c.full_name}
                subtitle={c.category?.name || 'Sin categoría'}
                tags={
                  <>
                    <Badge
                      variant="light"
                      size="lg"
                      color={ESTADOS_ALUMNO[normalizarEstado(c.status)].color}
                    >
                      {ESTADOS_ALUMNO[normalizarEstado(c.status)].label}
                    </Badge>
                    <CategoriaDelHijo studentId={c.id} />
                  </>
                }
                trailing={
                  // Desvincular sale de la fila: es destructivo y estaba a 28 px
                  // pegado al nombre.
                  <Menu position="bottom-end" withArrow>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" aria-label={`Opciones de ${c.full_name}`}>
                        <IconDotsVertical size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        color="red"
                        leftSection={<IconUnlink size={16} />}
                        onClick={() => confirmUnlink(c)}
                      >
                        Desvincular
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                }
                withChevron={false}
              />
            </Stack>
          ))}
        </Stack>
      )}

      <BottomSheet
        opened={abierto}
        onClose={() => setAbierto(false)}
        title="Vincular hijo"
        description="Escribe el código que te dio la academia. Si no lo tienes, pon su nombre completo."
        size="auto"
        primaryAction={{
          label: 'Vincular',
          loading: link.isPending,
          onClick: () => form.onSubmit(onLink)(),
          disabled: !form.values.student_code.trim() && !form.values.full_name.trim(),
        }}
      >
        <Stack>
          <TextInput
            label="Código del alumno"
            // Ayuda permanente, no solo un `placeholder` que desaparece al
            // escribir.
            description="Te lo da la academia"
            autoCapitalize="characters"
            {...form.getInputProps('student_code')}
          />
          <Group justify="center">
            <Text size="sm" c="dimmed">
              o
            </Text>
          </Group>
          <TextInput
            label="Nombre completo del alumno"
            description="Como lo registró la academia"
            autoCapitalize="words"
            {...form.getInputProps('full_name')}
          />
        </Stack>
      </BottomSheet>
    </>
  );
}
