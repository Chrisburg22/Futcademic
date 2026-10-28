import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Group,
  Menu,
  Modal,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconCategory,
  IconDownload,
  IconLink,
  IconPlus,
  IconSearchOff,
  IconShirt,
  IconUserPlus,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useBulkUpdateStudents,
  useDeleteStudent,
  useGetStudents,
  useUpdateStudentStatus,
  useUpdateUniform,
  type AccionMasiva,
} from '../../hooks/useStudents';
import { useGetPendingPayments } from '../../hooks/usePayments';
import { useLocalPref } from '../../hooks/useLocalPref';
import { StudentWizard } from './components/StudentWizard';
import { InviteStudentModal } from './components/InviteStudentModal';
import { StudentEditForm } from './components/StudentEditForm';
import { StudentsSummary } from './components/StudentsSummary';
import { StudentsToolbar } from './components/StudentsToolbar';
import {
  COLUMNAS_INICIALES,
  StudentsTable,
  type ColumnaAlumno,
  type Densidad,
} from './components/StudentsTable';
import { useGetCategories, useGetMyCategories } from '../../hooks/useCategories';
import { useGetUsers } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { mensajeDeError } from '../../lib/categories';
import { saveBlob } from '../../lib/download';
import {
  ESTADOS_ALUMNO,
  FILTROS_VACIOS,
  OPCIONES_ESTADO,
  ORDEN_INICIAL,
  alumnosACsv,
  anioNacimiento,
  escribirEstadoEnUrl,
  filtrarAlumnos,
  hayFiltros,
  leerEstadoDeUrl,
  ordenarAlumnos,
  resumirAlumnos,
  type CampoOrden,
  type ContextoAlumnos,
  type FiltrosAlumnos,
  type Orden,
} from '../../lib/students';
import type { Student, StudentStatus } from '../../types';

export function StudentsPage() {
  const navigate = useRouter();
  // `useSearchParams` sí tiene la query en el primer render de una navegación
  // suave (un enlace de Inicio como `?tutor=sin`), a diferencia de
  // `window.location.search`.
  const consultaInicial = useSearchParams();
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'profesor';
  // Estado y baja son solo del admin en el backend; el profesor no los ve.
  const puedeAdministrar = !isTeacher;

  // Un profesor solo trabaja con sus categorías asignadas
  const { data: myCategories = [] } = useGetMyCategories(isTeacher);
  const { data: allCategories = [] } = useGetCategories(!isTeacher);
  const categories = isTeacher ? myCategories : allCategories;
  const { data: users = [] } = useGetUsers();
  const parents = users.filter((u: any) => u.role === 'padre');

  // La lista completa se trae una vez: el backend no pagina ni filtra más que
  // por categoría, y una academia maneja cientos de alumnos, no miles.
  const { data: students = [], isLoading, isError, refetch } = useGetStudents();
  const alumnos = students as Student[];

  // El adeudo del mes no viene en `GET /students`: se cruza con la cobranza
  // pendiente, que es lo que permite filtrar y ordenar por deuda.
  const { data: cobranza } = useGetPendingPayments(undefined, !!profile && puedeAdministrar);
  const contexto: ContextoAlumnos = useMemo(() => {
    if (!puedeAdministrar || !cobranza?.pending) return {};
    const deudas: Record<string, number> = {};
    for (const fila of cobranza.pending as any[]) {
      deudas[fila.id] = Number(fila.pending_amount) || 0;
    }
    return { deudas };
  }, [cobranza, puedeAdministrar]);
  const hayCobranza = !!contexto.deudas;

  const [inicial] = useState(() => leerEstadoDeUrl(consultaInicial.toString()));
  const [filtros, setFiltros] = useState<FiltrosAlumnos>(inicial.filtros);
  const [busquedaDebounced] = useDebouncedValue(filtros.busqueda, 200);
  const [orden, setOrden] = useState<Orden>(inicial.orden);
  const [pagina, setPagina] = useState(inicial.pagina);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());

  // Preferencias de la tabla: las decide quien la usa y se recuerdan.
  const [columnas, setColumnas] = useLocalPref<ColumnaAlumno[]>(
    'alumnos.columnas',
    COLUMNAS_INICIALES,
  );
  const [densidad, setDensidad] = useLocalPref<Densidad>('alumnos.densidad', 'comoda');
  const [porPagina, setPorPagina] = useLocalPref<number>('alumnos.porPagina', 25);

  const [createOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [inviteOpen, invite] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSucio, setEditSucio] = useState(false);
  const [categoriaMasiva, setCategoriaMasiva] = useState<string | null>(null);
  const [moverOpen, mover] = useDisclosure(false);

  const uniformMut = useUpdateUniform();
  const statusMut = useUpdateStudentStatus();
  const deleteMut = useDeleteStudent();
  const bulkMut = useBulkUpdateStudents();

  const cambiarFiltros = (cambios: Partial<FiltrosAlumnos> | null) => {
    setFiltros((actual) => (cambios === null ? FILTROS_VACIOS : { ...actual, ...cambios }));
  };

  // Al filtrar o reordenar se vuelve a la primera página; la selección de
  // alumnos que ya no se ven se descarta para no actuar sobre filas ocultas.
  const filtrosEfectivos = useMemo(
    () => ({ ...filtros, busqueda: busquedaDebounced }),
    [filtros, busquedaDebounced],
  );
  // La primera vuelta respeta la página que venía en la URL.
  const primeraVuelta = useRef(true);
  useEffect(() => {
    if (primeraVuelta.current) {
      primeraVuelta.current = false;
      return;
    }
    setPagina(1);
  }, [filtrosEfectivos, orden]);

  // Los filtros viven en la URL: así se comparte una vista, se vuelve atrás
  // sin perderla y Inicio puede enlazar "los 4 que no tienen tutor".
  useEffect(() => {
    const consulta = escribirEstadoEnUrl({ filtros: filtrosEfectivos, orden, pagina });
    window.history.replaceState(null, '', `${window.location.pathname}${consulta}`);
  }, [filtrosEfectivos, orden, pagina]);

  const resumen = useMemo(() => resumirAlumnos(alumnos, contexto), [alumnos, contexto]);
  const filtrados = useMemo(
    () => ordenarAlumnos(filtrarAlumnos(alumnos, filtrosEfectivos, contexto), orden, contexto),
    [alumnos, filtrosEfectivos, orden, contexto],
  );
  const anios = useMemo(
    () =>
      Array.from(new Set(alumnos.map((a) => anioNacimiento(a.birth_date)).filter(Boolean) as string[]))
        .sort()
        .reverse(),
    [alumnos],
  );

  const paginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = filtrados.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  useEffect(() => {
    const ids = new Set(filtrados.map((a) => a.id));
    setSeleccion((actual) => {
      const quedan = [...actual].filter((id) => ids.has(id));
      return quedan.length === actual.size ? actual : new Set(quedan);
    });
  }, [filtrados]);

  const alternarOrden = (campo: CampoOrden) =>
    setOrden((o) =>
      o.campo === campo ? { campo, direccion: o.direccion === 'asc' ? 'desc' : 'asc' } : { campo, direccion: 'asc' },
    );

  const ordenComoTexto = `${orden.campo}:${orden.direccion}`;

  const marcar = (ids: string[], marcado: boolean) =>
    setSeleccion((actual) => {
      const siguiente = new Set(actual);
      ids.forEach((id) => (marcado ? siguiente.add(id) : siguiente.delete(id)));
      return siguiente;
    });

  const editing = alumnos.find((s) => s.id === editingId);

  const cerrarEdicion = () => {
    if (!editSucio) return setEditingId(null);
    modals.openConfirmModal({
      title: 'Descartar cambios',
      children: <Text size="sm">Tienes cambios sin guardar. Si cierras, se pierden.</Text>,
      labels: { confirm: 'Descartar', cancel: 'Seguir editando' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        setEditSucio(false);
        setEditingId(null);
      },
    });
  };

  const cambiarEstado = (alumno: Student, estado: StudentStatus) =>
    statusMut.mutate(
      { id: alumno.id, status: estado },
      {
        onSuccess: () =>
          notifications.show({
            color: 'green',
            message: `${alumno.full_name} ahora está ${ESTADOS_ALUMNO[estado].label.toLowerCase()}`,
          }),
        onError: (error) =>
          notifications.show({
            color: 'red',
            title: 'No se pudo cambiar el estado',
            message: mensajeDeError(error, 'Inténtalo de nuevo.'),
          }),
      },
    );

  const alternarUniforme = (alumno: Student) =>
    uniformMut.mutate(
      { id: alumno.id, uniform_delivered: !alumno.uniform_delivered },
      {
        onError: (error) =>
          notifications.show({
            color: 'red',
            title: 'No se pudo actualizar el uniforme',
            message: mensajeDeError(error, 'Inténtalo de nuevo.'),
          }),
      },
    );

  const confirmarEliminar = (alumno: Student) =>
    modals.openConfirmModal({
      title: `Eliminar a ${alumno.full_name}`,
      children: (
        <Stack gap="xs">
          <Text size="sm">
            Se quita de la academia y se guarda una copia en el historial de eliminados.
            <strong> No hay forma de restaurarlo desde la app.</strong>
          </Text>
          <Text size="sm" c="dimmed">
            Si solo dejó de entrenar, es mejor marcarlo como inactivo: conserva su historial de
            asistencias y pagos.
          </Text>
        </Stack>
      ),
      labels: { confirm: 'Eliminar definitivamente', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteMut.mutateAsync(alumno.id);
          notifications.show({ color: 'green', message: `${alumno.full_name} fue eliminado` });
        } catch (error) {
          notifications.show({
            color: 'red',
            title: 'No se pudo eliminar',
            message: mensajeDeError(error, 'Inténtalo de nuevo.'),
          });
        }
      },
    });

  const ejecutarMasiva = async (accion: AccionMasiva, descripcion: string) => {
    const ids = [...seleccion];
    const resultado = await bulkMut.mutateAsync({ ids, accion });
    if (resultado.fallidos.length === 0) {
      notifications.show({ color: 'green', message: `${descripcion}: ${resultado.correctos} alumnos` });
      setSeleccion(new Set());
    } else {
      notifications.show({
        color: 'orange',
        title: 'Se completó solo en parte',
        message: `${resultado.correctos} de ${resultado.total} alumnos. Los que fallaron siguen seleccionados.`,
      });
      setSeleccion(new Set(resultado.fallidos));
    }
  };

  const exportar = (lista: Student[], nombre: string) => {
    saveBlob(new Blob([alumnosACsv(lista, contexto)], { type: 'text/csv;charset=utf-8' }), nombre);
  };

  const seleccionados = alumnos.filter((a) => seleccion.has(a.id));
  const paginaSeleccionada = visibles.length > 0 && visibles.every((a) => seleccion.has(a.id));
  const faltanPorSeleccionar = filtrados.filter((a) => !seleccion.has(a.id)).length;
  const hayAlumnos = alumnos.length > 0;
  // Filtrar por adeudo sin la cobranza cargada daría "ningún alumno coincide".
  const esperandoCobranza = puedeAdministrar && !!filtros.adeudo && !hayCobranza;

  return (
    <>
      <PageHeader
        title="Alumnos"
        description="Quién entrena, quién debe documentos o pagos, y a quién falta atender."
        actions={
          <Group>
            <Button
              variant="default"
              leftSection={<IconDownload size={16} />}
              disabled={filtrados.length === 0}
              onClick={() =>
                exportar(
                  filtrados,
                  `alumnos-${hayFiltros(filtros) ? 'filtrados' : 'todos'}.csv`,
                )
              }
            >
              Exportar
            </Button>
            <Button variant="light" leftSection={<IconLink size={16} />} onClick={invite.open}>
              Invitar alumno
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
              Nuevo alumno
            </Button>
          </Group>
        }
      />

      {hayAlumnos && (
        <StudentsSummary
          resumen={resumen}
          filtros={filtros}
          cargando={isLoading}
          onFiltro={(cambios) =>
            cambios === null
              ? cambiarFiltros(null)
              : setFiltros({ ...FILTROS_VACIOS, categoria: filtros.categoria, ...cambios })
          }
          verEstados={puedeAdministrar}
          verAdeudo={hayCobranza}
        />
      )}

      {(hayAlumnos || hayFiltros(filtros)) && (
        <StudentsToolbar
          filtros={filtros}
          onChange={cambiarFiltros}
          orden={ordenComoTexto}
          onOrden={(valor) => {
            const [campo, direccion] = valor.split(':');
            setOrden({ campo: campo as CampoOrden, direccion: direccion as Orden['direccion'] });
          }}
          categorias={categories}
          anios={anios}
          mostrados={filtrados.length}
          total={alumnos.length}
          puedeCambiarEstado={puedeAdministrar}
          puedeVerPagos={hayCobranza}
          porAtender={resumen.porAtender}
        />
      )}

      {seleccion.size > 0 && (
        <Paper
          withBorder
          radius="md"
          p="xs"
          mb="sm"
          shadow="sm"
          role="region"
          aria-label="Acciones para los alumnos seleccionados"
          style={{ position: 'sticky', top: 8, zIndex: 20 }}
        >
          <Group justify="space-between" wrap="wrap" gap="xs">
            <Group gap="xs">
              <Button
                variant="subtle"
                color="gray"
                size="compact-sm"
                leftSection={<IconX size={14} />}
                onClick={() => setSeleccion(new Set())}
              >
                Quitar selección
              </Button>
              <Text size="sm" fw={600}>
                {seleccion.size} {seleccion.size === 1 ? 'seleccionado' : 'seleccionados'}
              </Text>
            </Group>
            <Group gap="xs">
              {puedeAdministrar && (
                <Menu withinPortal shadow="md">
                  <Menu.Target>
                    <Button variant="default" size="compact-md" loading={bulkMut.isPending}>
                      Cambiar estado
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {OPCIONES_ESTADO.map((o) => (
                      <Menu.Item
                        key={o.value}
                        onClick={() =>
                          ejecutarMasiva(
                            { tipo: 'status', status: o.value },
                            `Estado «${o.label}» aplicado a`,
                          )
                        }
                      >
                        {o.label}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
              )}
              <Button
                variant="default"
                size="compact-md"
                leftSection={<IconCategory size={14} />}
                onClick={() => {
                  setCategoriaMasiva(null);
                  mover.open();
                }}
              >
                Mover de categoría
              </Button>
              <Button
                variant="default"
                size="compact-md"
                leftSection={<IconShirt size={14} />}
                loading={bulkMut.isPending}
                onClick={() =>
                  ejecutarMasiva({ tipo: 'uniform', entregado: true }, 'Uniforme entregado a')
                }
              >
                Uniforme entregado
              </Button>
              <Button
                variant="default"
                size="compact-md"
                leftSection={<IconDownload size={14} />}
                onClick={() => exportar(seleccionados, 'alumnos-seleccionados.csv')}
              >
                Exportar
              </Button>
            </Group>
          </Group>
          {paginaSeleccionada && faltanPorSeleccionar > 0 && (
            <Group gap="xs" mt="xs" role="status">
              <Text size="sm" c="dimmed">
                Seleccionaste los {visibles.length} de esta página.
              </Text>
              <Button
                variant="subtle"
                size="compact-sm"
                onClick={() => marcar(filtrados.map((a) => a.id), true)}
              >
                Seleccionar los {filtrados.length} alumnos
                {hayFiltros(filtros) ? ' filtrados' : ''}
              </Button>
            </Group>
          )}
        </Paper>
      )}

      {isLoading || esperandoCobranza ? (
        <Card withBorder padding="md" radius="md">
          <Stack gap="sm">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={44} radius="sm" />
            ))}
          </Stack>
        </Card>
      ) : isError ? (
        <Card withBorder radius="md">
          <EmptyState
            title="No se pudo cargar la lista"
            description="Revisa tu conexión e inténtalo de nuevo."
            action={<Button onClick={() => refetch()}>Reintentar</Button>}
          />
        </Card>
      ) : !hayAlumnos ? (
        <Card withBorder radius="md">
          <EmptyState
            icon={<IconUsers size={32} />}
            title="Aún no hay alumnos"
            description="Da de alta al primero, o manda un link de inscripción para que el tutor llene el expediente."
            action={
              <Group>
                <Button leftSection={<IconUserPlus size={16} />} onClick={openCreate}>
                  Nuevo alumno
                </Button>
                <Button variant="light" leftSection={<IconLink size={16} />} onClick={invite.open}>
                  Invitar alumno
                </Button>
              </Group>
            }
          />
        </Card>
      ) : filtrados.length === 0 ? (
        <Card withBorder radius="md">
          <EmptyState
            icon={<IconSearchOff size={32} />}
            title="Ningún alumno coincide"
            description="Prueba con otra búsqueda o quita algunos filtros."
            action={<Button variant="light" onClick={() => cambiarFiltros(null)}>Limpiar filtros</Button>}
          />
        </Card>
      ) : (
        <>
          <StudentsTable
            alumnos={visibles}
            orden={orden}
            onOrden={alternarOrden}
            seleccion={seleccion}
            onSeleccion={marcar}
            puedeAdministrar={puedeAdministrar}
            contexto={contexto}
            columnas={columnas}
            onColumnas={setColumnas}
            densidad={densidad}
            onDensidad={setDensidad}
            porPagina={porPagina}
            onPorPagina={(valor) => {
              setPorPagina(valor);
              setPagina(1);
            }}
            onAbrir={(a) => navigate.push(`/admin/students/${a.id}`)}
            onEditar={(a) => setEditingId(a.id)}
            onEliminar={confirmarEliminar}
            onEstado={cambiarEstado}
            onUniforme={alternarUniforme}
          />
          {paginas > 1 && (
            <Group justify="space-between" mt="md" wrap="wrap">
              <Text size="sm" c="dimmed">
                {(paginaActual - 1) * porPagina + 1}–
                {Math.min(paginaActual * porPagina, filtrados.length)} de {filtrados.length}
              </Text>
              <Pagination value={paginaActual} onChange={setPagina} total={paginas} />
            </Group>
          )}
        </>
      )}

      <StudentWizard
        opened={createOpen}
        onClose={closeCreate}
        categories={categories}
        parents={parents}
      />

      <Drawer
        opened={!!editing}
        onClose={cerrarEdicion}
        position="right"
        size="lg"
        title={`Editar a ${editing?.full_name || ''}`}
        closeButtonProps={{ 'aria-label': 'Cerrar edición' }}
      >
        {editing && (
          <StudentEditForm
            alumno={editing}
            categorias={categories}
            tutores={parents}
            onDirtyChange={setEditSucio}
            onSaved={() => {
              setEditSucio(false);
              setEditingId(null);
            }}
            onCancel={cerrarEdicion}
          />
        )}
      </Drawer>

      <Modal
        opened={moverOpen}
        onClose={mover.close}
        title={`Mover ${seleccion.size} ${seleccion.size === 1 ? 'alumno' : 'alumnos'} de categoría`}
        centered
      >
        <Stack>
          <Select
            label="Nueva categoría"
            placeholder="Elige una categoría"
            searchable
            data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
            value={categoriaMasiva}
            onChange={setCategoriaMasiva}
            data-autofocus
          />
          <Text size="xs" c="dimmed">
            Su asistencia y mensualidad pasan a la nueva categoría. Los registros anteriores se
            conservan.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={mover.close}>
              Cancelar
            </Button>
            <Button
              disabled={!categoriaMasiva}
              loading={bulkMut.isPending}
              onClick={async () => {
                if (!categoriaMasiva) return;
                await ejecutarMasiva({ tipo: 'category', category_id: categoriaMasiva }, 'Movidos');
                mover.close();
              }}
            >
              Mover
            </Button>
          </Group>
        </Stack>
      </Modal>

      <InviteStudentModal
        opened={inviteOpen}
        onClose={invite.close}
        categories={categories}
        defaultCategoryId={filtros.categoria}
      />
    </>
  );
}
