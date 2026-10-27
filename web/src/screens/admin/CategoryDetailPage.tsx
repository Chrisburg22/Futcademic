import {
  Badge,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconArchive,
  IconArchiveOff,
  IconArrowLeft,
  IconCalendarEvent,
  IconClipboardList,
  IconLayoutGrid,
  IconUsers,
  IconUserStar,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useParams, useRouter } from 'next/navigation';
import { useGetCategory, useUpdateCategoryStatus } from '../../hooks/useCategories';
import { useGetEvents } from '../../hooks/useEvents';
import { useGetMyPermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { CategoryAttendanceHistory } from '../../components/attendance/CategoryAttendanceHistory';
import { CategorySummary } from '../../components/categories/CategorySummary';
import {
  ESTADOS_CATEGORIA,
  formatearAnios,
  formatearMensualidad,
  mensajeDeError,
} from '../../lib/categories';
import {
  CategoryCoachesPanel,
  CategoryStudentsPanel,
} from './components/CategoryMembersPanel';

function Metrica({ valor, etiqueta }: { valor: string | number; etiqueta: string }) {
  return (
    <Card withBorder radius="md" padding="md">
      <Text fz={28} fw={700} lh={1.1}>
        {valor}
      </Text>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} mt={4}>
        {etiqueta}
      </Text>
    </Card>
  );
}

export function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useRouter();
  const { profile } = useAuth();
  const role = profile?.role;
  const esAdmin = role === 'super_admin' || role === 'admin';

  const { data: permisos } = useGetMyPermissions(role === 'profesor');
  const puedeGestionar = esAdmin || (role === 'profesor' && !!permisos?.can_manage_categories);

  // Antes esta pantalla pedía TODAS las categorías y buscaba la suya en cliente.
  const { data: category, isLoading, isError } = useGetCategory(id);
  const { data: events = [], isLoading: cargandoEventos } = useGetEvents({ category_id: id });
  const cambiarEstado = useUpdateCategoryStatus();

  if (isLoading) return <LoadingState />;
  if (isError || !category) return <EmptyState description="Categoría no encontrada." />;

  const meta = ESTADOS_CATEGORIA[category.status] || ESTADOS_CATEGORIA.activa;

  const archivar = () =>
    modals.openConfirmModal({
      title: 'Archivar categoría',
      children: (
        <Text size="sm">
          "{category.name}" saldrá del listado y de los selectores. El historial se conserva.
        </Text>
      ),
      labels: { confirm: 'Archivar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await cambiarEstado.mutateAsync({ id: category.id, status: 'archivada' });
          notifications.show({ color: 'green', message: 'Categoría archivada' });
        } catch (e: any) {
          notifications.show({ color: 'red', message: mensajeDeError(e, 'Error al archivar') });
        }
      },
    });

  const restaurar = async () => {
    try {
      await cambiarEstado.mutateAsync({ id: category.id, status: 'activa' });
      notifications.show({ color: 'green', message: 'Categoría restaurada' });
    } catch (e: any) {
      notifications.show({ color: 'red', message: mensajeDeError(e, 'Error al restaurar') });
    }
  };

  return (
    <>
      <PageHeader
        title={category.name}
        description={`Años ${formatearAnios(category)} · ${meta.label}`}
        actions={
          <>
            <Button
              variant="default"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate.push('/admin/categories')}
            >
              Volver
            </Button>
            {esAdmin &&
              (category.status === 'archivada' ? (
                <Button
                  variant="light"
                  color="green"
                  leftSection={<IconArchiveOff size={16} />}
                  onClick={restaurar}
                  loading={cambiarEstado.isPending}
                >
                  Restaurar
                </Button>
              ) : (
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconArchive size={16} />}
                  onClick={archivar}
                >
                  Archivar
                </Button>
              ))}
          </>
        }
      />

      <Group mb="md" gap="xs" wrap="wrap">
        <Badge
          variant="light"
          color={meta.color}
          leftSection={
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 4,
                background: category.color || 'var(--mantine-color-gray-4)',
              }}
            />
          }
        >
          {meta.label}
        </Badge>
        <Badge variant="light" color="teal">
          Mensualidad {formatearMensualidad(category.monthly_fee)}
        </Badge>
        {category.max_students && (
          <Badge variant="light" color="blue">
            Aforo {category.max_students}
          </Badge>
        )}
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="md">
        <Metrica
          valor={
            category.max_students
              ? `${category.students_count ?? 0}/${category.max_students}`
              : category.students_count ?? 0
          }
          etiqueta="Jugadores"
        />
        <Metrica valor={category.coaches_count ?? 0} etiqueta="Entrenadores" />
        <Metrica valor={category.sessions_count} etiqueta="Sesiones" />
        <Metrica valor={category.upcoming_sessions_count} etiqueta="Próximas" />
      </SimpleGrid>

      <Tabs defaultValue="resumen">
        <Tabs.List>
          <Tabs.Tab value="resumen" leftSection={<IconLayoutGrid size={16} />}>
            Resumen
          </Tabs.Tab>
          <Tabs.Tab value="students" leftSection={<IconUsers size={16} />}>
            Jugadores
          </Tabs.Tab>
          <Tabs.Tab value="coaches" leftSection={<IconUserStar size={16} />}>
            Entrenadores
          </Tabs.Tab>
          <Tabs.Tab value="agenda" leftSection={<IconCalendarEvent size={16} />}>
            Agenda
          </Tabs.Tab>
          <Tabs.Tab value="attendance" leftSection={<IconClipboardList size={16} />}>
            Asistencias
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="resumen" pt="md">
          <CategorySummary
            nombre={category.name}
            color={category.color}
            anios={formatearAnios(category)}
            descripcion={category.description}
            jugadores={category.students_count ?? 0}
            entrenadores={(category.all_teachers || []).map((t) => ({
              id: t.id,
              nombre: t.full_name,
            }))}
            horario={(category.schedule || []).map((s) => ({
              id: s.id,
              nombre: s.name,
              hora: s.start_time,
              cancha: s.venue,
            }))}
          />
        </Tabs.Panel>

        <Tabs.Panel value="students" pt="md">
          <CategoryStudentsPanel category={category} puedeGestionar={puedeGestionar} />
        </Tabs.Panel>

        <Tabs.Panel value="coaches" pt="md">
          <CategoryCoachesPanel category={category} puedeGestionar={puedeGestionar} />
        </Tabs.Panel>

        <Tabs.Panel value="agenda" pt="md">
          {cargandoEventos ? (
            <LoadingState />
          ) : events.length === 0 ? (
            <EmptyState description="Sin eventos para esta categoría." />
          ) : (
            <Stack>
              {events.map((e: any) => (
                <Card key={e.id} withBorder padding="md" radius="md">
                  <Group justify="space-between">
                    <div>
                      <Group gap="xs">
                        <Text fw={500}>{e.name || e.description || 'Evento'}</Text>
                        <Badge tt="capitalize" variant="light">
                          {e.type}
                        </Badge>
                        {e.is_recurring && (
                          <Badge variant="light" color="blue">
                            Recurrente
                          </Badge>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed">
                        Inicio: {dayjs(e.date).format('DD MMM YYYY')} {e.start_time || ''}
                      </Text>
                    </div>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="attendance" pt="md">
          <CategoryAttendanceHistory categoryId={id!} />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
