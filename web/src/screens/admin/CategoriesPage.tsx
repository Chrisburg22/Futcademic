import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconArchive,
  IconArchiveOff,
  IconCategory,
  IconEdit,
  IconEye,
  IconPlus,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import {
  useGetCategories,
  useGetCategoriesPaged,
  useGetMyCategories,
  useUpdateCategory,
  useUpdateCategoryStatus,
} from '../../hooks/useCategories';
import { useGetMyPermissions } from '../../hooks/usePermissions';
import { useGetTeachers } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ESTADOS_CATEGORIA,
  formatearGeneracion,
  formatearMensualidad,
  formatearOcupacion,
  mensajeDeError,
} from '../../lib/categories';
import type { Category, CategoryStatus } from '../../types';
import { CategoryWizard } from './components/CategoryWizard';
import {
  CategoryFormFields,
  aPayloadCategoria,
  valoresInicialesCategoria,
  validacionEquipo,
  validacionIdentidad,
  type CategoryFormValues,
} from './components/CategoryFormFields';

const POR_PAGINA = 25;

const ORDENES = [
  { value: 'birth_year', label: 'Año (reciente primero)' },
  { value: 'name', label: 'Nombre (A-Z)' },
  { value: 'created_at', label: 'Más recientes' },
  { value: 'monthly_fee', label: 'Mensualidad' },
];

export function CategoriesPage() {
  const navigate = useRouter();
  const { profile } = useAuth();
  const role = profile?.role;
  const esAdmin = role === 'super_admin' || role === 'admin';

  const { data: permisos } = useGetMyPermissions(role === 'profesor');
  // El permiso `can_manage_categories` existía en la base y en la UI de
  // profesores sin que nada lo consultara; aquí decide lo que ve el profesor.
  const puedeGestionar = esAdmin || (role === 'profesor' && !!permisos?.can_manage_categories);

  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced] = useDebouncedValue(busqueda, 300);
  const [estado, setEstado] = useState<CategoryStatus | 'all'>('activa');
  const [anio, setAnio] = useState<string | null>(null);
  const [profesor, setProfesor] = useState<string | null>(null);
  const [orden, setOrden] = useState('birth_year');
  const [pagina, setPagina] = useState(1);

  const filtros = {
    search: busquedaDebounced || undefined,
    status: estado,
    birth_year: anio,
    teacher_id: profesor,
    sort: orden as any,
    order: orden === 'name' ? ('asc' as const) : ('desc' as const),
    page: pagina,
    per_page: POR_PAGINA,
  };

  // Un profesor sin permiso de gestión solo necesita sus categorías.
  const soloMias = role === 'profesor' && !puedeGestionar;
  const listaPaginada = useGetCategoriesPaged(filtros, !soloMias);
  const mias = useGetMyCategories(soloMias);

  const categorias: Category[] = soloMias ? mias.data || [] : listaPaginada.data?.items || [];
  const total = soloMias ? categorias.length : listaPaginada.data?.total ?? 0;
  const cargando = soloMias ? mias.isLoading : listaPaginada.isLoading;

  const { data: teachers = [] } = useGetTeachers();

  // Las generaciones del filtro salen de los datos, no de una lista de años:
  // la academia usa rangos ("2014-2015") y grupos sin año ("Porteros").
  const { data: todasLasCategorias = [] } = useGetCategories(!soloMias);
  const generaciones = useMemo(
    () =>
      Array.from(
        new Set(todasLasCategorias.map((c) => c.birth_year).filter(Boolean)),
      ).sort((a, b) => b.localeCompare(a)),
    [todasLasCategorias],
  );
  const actualizar = useUpdateCategory();
  const cambiarEstado = useUpdateCategoryStatus();
  const [wizardAbierto, { open: abrirWizard, close: cerrarWizard }] = useDisclosure(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Guardar el id y no el objeto: tras invalidar la query el snapshot quedaba viejo.
  const editando = categorias.find((c) => c.id === editandoId);

  const editForm = useForm<CategoryFormValues>({
    initialValues: valoresInicialesCategoria(),
    validate: { ...validacionIdentidad, ...validacionEquipo },
  });

  const filtrosActivos = !!(busqueda || anio || profesor || estado !== 'activa');
  const totalAlumnos = useMemo(
    () => categorias.reduce((acc, c) => acc + (c.students_count ?? 0), 0),
    [categorias],
  );

  const limpiarFiltros = () => {
    setBusqueda('');
    setEstado('activa');
    setAnio(null);
    setProfesor(null);
    setPagina(1);
  };

  const alCambiarFiltro = <T,>(aplicar: (valor: T) => void) => (valor: T) => {
    aplicar(valor);
    setPagina(1);
  };

  const empezarEdicion = (categoria: Category) => {
    setEditandoId(categoria.id);
    editForm.setValues({
      name: categoria.name,
      description: categoria.description || '',
      color: categoria.color || '#198d4b',
      birth_year: categoria.birth_year || '',
      teacher_ids: (categoria.all_teachers || []).map((t) => t.id),
      monthly_fee: categoria.monthly_fee ?? 0,
      max_students: categoria.max_students ?? '',
      status: categoria.status,
    });
    editForm.resetDirty();
  };

  const guardarEdicion = async (valores: CategoryFormValues) => {
    if (!editandoId) return;
    try {
      await actualizar.mutateAsync({
        id: editandoId,
        ...aPayloadCategoria(valores),
      });
      notifications.show({ color: 'green', message: 'Categoría actualizada' });
      setEditandoId(null);
    } catch (e: any) {
      // El modal se queda abierto a propósito: el usuario corrige y reintenta.
      notifications.show({
        color: 'red',
        message: mensajeDeError(e, 'Error al actualizar la categoría'),
      });
    }
  };

  const confirmarArchivar = (categoria: Category) =>
    modals.openConfirmModal({
      title: 'Archivar categoría',
      children: (
        <Stack gap="xs">
          <Text size="sm">
            "{categoria.name}" saldrá del listado y de los selectores. El historial de
            asistencias y pagos se conserva.
          </Text>
          {(categoria.students_count ?? 0) > 0 && (
            <Text size="sm" c="orange.8">
              Tiene {categoria.students_count} jugador
              {categoria.students_count === 1 ? '' : 'es'}: seguirán generando mensualidad hasta
              que los muevas a otra categoría.
            </Text>
          )}
        </Stack>
      ),
      labels: { confirm: 'Archivar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await cambiarEstado.mutateAsync({ id: categoria.id, status: 'archivada' });
          notifications.show({ color: 'green', message: 'Categoría archivada' });
        } catch (e: any) {
          notifications.show({
            color: 'red',
            message: mensajeDeError(e, 'Error al archivar la categoría'),
          });
        }
      },
    });

  const restaurar = async (categoria: Category) => {
    try {
      await cambiarEstado.mutateAsync({ id: categoria.id, status: 'activa' });
      notifications.show({ color: 'green', message: 'Categoría restaurada' });
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: mensajeDeError(e, 'Error al restaurar la categoría'),
      });
    }
  };

  const paginas = Math.ceil(total / POR_PAGINA);

  return (
    <>
      <PageHeader
        title="Categorías"
        description={
          cargando
            ? undefined
            : `${total} categoría${total === 1 ? '' : 's'} · ${totalAlumnos} jugador${
                totalAlumnos === 1 ? '' : 'es'
              }`
        }
        actions={
          puedeGestionar ? (
            <Button leftSection={<IconPlus size={16} />} onClick={abrirWizard}>
              Nueva categoría
            </Button>
          ) : undefined
        }
      />

      {!soloMias && (
        <Card withBorder padding="md" radius="md" mb="md">
          <Group align="flex-end" wrap="wrap" gap="sm">
            <TextInput
              label="Buscar"
              placeholder="Nombre de la categoría"
              leftSection={<IconSearch size={16} />}
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.currentTarget.value);
                setPagina(1);
              }}
              style={{ flex: '1 1 220px' }}
            />
            <Select
              label="Estado"
              data={[
                ...Object.entries(ESTADOS_CATEGORIA).map(([value, meta]) => ({
                  value,
                  label: meta.label,
                })),
                { value: 'all', label: 'Todas' },
              ]}
              value={estado}
              onChange={alCambiarFiltro((v: string | null) =>
                setEstado((v as CategoryStatus | 'all') || 'activa'),
              )}
              allowDeselect={false}
              style={{ flex: '0 1 150px' }}
            />
            <Select
              label="Generación"
              placeholder="Todas"
              data={generaciones}
              value={anio}
              onChange={alCambiarFiltro(setAnio)}
              searchable
              clearable
              style={{ flex: '0 1 130px' }}
            />
            <Select
              label="Entrenador"
              placeholder="Todos"
              data={teachers.map((t: any) => ({ value: t.id, label: t.full_name }))}
              value={profesor}
              onChange={alCambiarFiltro(setProfesor)}
              searchable
              clearable
              style={{ flex: '0 1 190px' }}
            />
            <Select
              label="Ordenar por"
              data={ORDENES}
              value={orden}
              onChange={alCambiarFiltro((v: string | null) => setOrden(v || 'birth_year'))}
              allowDeselect={false}
              style={{ flex: '0 1 190px' }}
            />
            {filtrosActivos && (
              <Button
                variant="subtle"
                leftSection={<IconX size={14} />}
                onClick={limpiarFiltros}
              >
                Limpiar
              </Button>
            )}
          </Group>
        </Card>
      )}

      {cargando ? (
        <LoadingState />
      ) : categorias.length === 0 ? (
        filtrosActivos ? (
          <EmptyState
            title="Sin resultados"
            description="Ninguna categoría coincide con esos filtros."
            icon={<IconSearch size={32} />}
            action={
              <Button variant="default" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="Sin categorías"
            description={
              puedeGestionar
                ? 'Crea la primera categoría para organizar a tus jugadores por generación.'
                : 'Todavía no tienes categorías asignadas.'
            }
            icon={<IconCategory size={32} />}
            action={
              puedeGestionar ? (
                <Button leftSection={<IconPlus size={16} />} onClick={abrirWizard}>
                  Crear la primera categoría
                </Button>
              ) : undefined
            }
          />
        )
      ) : (
        <Card withBorder padding={0} radius="md">
          <Table.ScrollContainer minWidth={820}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Categoría</Table.Th>
                  <Table.Th>Años</Table.Th>
                  <Table.Th>Jugadores</Table.Th>
                  <Table.Th>Entrenadores</Table.Th>
                  <Table.Th>Mensualidad</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {categorias.map((c) => {
                  const meta = ESTADOS_CATEGORIA[c.status] || ESTADOS_CATEGORIA.activa;
                  const entrenadores = c.all_teachers || [];
                  return (
                    <Table.Tr key={c.id}>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <span
                            aria-hidden
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              flexShrink: 0,
                              background: c.color || 'var(--mantine-color-gray-4)',
                            }}
                          />
                          <div>
                            <Text fw={500}>{c.name}</Text>
                            {c.description && (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {c.description}
                              </Text>
                            )}
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light">{formatearGeneracion(c)}</Badge>
                      </Table.Td>
                      <Table.Td>{formatearOcupacion(c)}</Table.Td>
                      <Table.Td>
                        {entrenadores.length === 0 ? (
                          <Text c="dimmed">—</Text>
                        ) : (
                          <Avatar.Group spacing="xs">
                            {entrenadores.slice(0, 3).map((t) => (
                              <Tooltip key={t.id} label={t.full_name || 'Sin nombre'}>
                                <Avatar size="sm" radius="xl">
                                  {t.full_name?.[0]?.toUpperCase() || '?'}
                                </Avatar>
                              </Tooltip>
                            ))}
                            {entrenadores.length > 3 && (
                              <Avatar size="sm" radius="xl">
                                +{entrenadores.length - 3}
                              </Avatar>
                            )}
                          </Avatar.Group>
                        )}
                      </Table.Td>
                      <Table.Td>{formatearMensualidad(c.monthly_fee)}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={meta.color}>
                          {meta.label}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                          <ActionIcon
                            variant="subtle"
                            onClick={() => navigate.push(`/admin/categories/${c.id}`)}
                            aria-label="Ver detalle"
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          {puedeGestionar && (
                            <ActionIcon
                              variant="subtle"
                              onClick={() => empezarEdicion(c)}
                              aria-label="Editar"
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          )}
                          {esAdmin &&
                            (c.status === 'archivada' ? (
                              <ActionIcon
                                variant="subtle"
                                color="green"
                                onClick={() => restaurar(c)}
                                aria-label="Restaurar"
                              >
                                <IconArchiveOff size={16} />
                              </ActionIcon>
                            ) : (
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => confirmarArchivar(c)}
                                aria-label="Archivar"
                              >
                                <IconArchive size={16} />
                              </ActionIcon>
                            ))}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          {!soloMias && paginas > 1 && (
            <Group justify="flex-end" p="sm">
              <Pagination total={paginas} value={pagina} onChange={setPagina} size="sm" />
            </Group>
          )}
        </Card>
      )}

      <CategoryWizard opened={wizardAbierto} onClose={cerrarWizard} teachers={teachers} />

      <Modal
        opened={!!editandoId}
        onClose={() => setEditandoId(null)}
        title={editando ? `Editar ${editando.name}` : 'Editar categoría'}
        size="lg"
        centered
      >
        <form onSubmit={editForm.onSubmit(guardarEdicion)}>
          <Stack>
            <CategoryFormFields form={editForm} teachers={teachers} mostrarEstado={esAdmin} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setEditandoId(null)}>
                Cancelar
              </Button>
              <Button type="submit" loading={actualizar.isPending}>
                Guardar
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
