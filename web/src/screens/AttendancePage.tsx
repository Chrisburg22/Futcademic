'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Badge, Card, Select, Stack, Tabs, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconCalendarCheck,
  IconChartBar,
  IconClipboardList,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import {
  useGetAttendancesByCategory,
  useSaveAttendances,
} from '../hooks/useAttendances';
import { useCheckAchievements } from '../hooks/useAchievements';
import { useGetMyCategories, useGetCategories } from '../hooks/useCategories';
import { useGetStudents, useGetMyChildren } from '../hooks/useStudents';
import { useGetTrainings } from '../hooks/useEvents';
import { willQueueOffline } from '../lib/offlineMutations';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { CategoryAttendanceHistory } from '../components/attendance/CategoryAttendanceHistory';
import {
  AttendanceSessionBar,
  type SesionDelDia,
} from '../components/attendance/AttendanceSessionBar';
import { RollCallList } from '../components/attendance/RollCallList';
import {
  RollCallBarraGuardado,
  RollCallResumen,
} from '../components/attendance/RollCallStatus';
import { StudentAttendanceHistory } from '../components/attendance/StudentAttendanceHistory';
import {
  ESTADO_ASISTENCIAS_INICIAL,
  escribirEstadoEnUrl,
  estadisticasPorAlumno,
  etiquetaTipo,
  leerEstadoDeUrl,
  marcaDe,
  marcasDeRegistros,
  mismasMarcas,
  resumirPaseLista,
  type EstadoAsistencias,
  type Marca,
  type MarcasPorAlumno,
  type Periodo,
  type TipoSesion,
  type VistaHistorico,
} from '../lib/attendance';
import { normalizarEstado } from '../lib/students';
import { mensajeDeError } from '../lib/categories';
import type { Attendance, Student } from '../types';

// Referencias estables: `data = []` crearía un array nuevo en cada render y
// los `useMemo` y efectos que dependen de él no pararían nunca.
const SIN_REGISTROS: Attendance[] = [];
const SIN_ALUMNOS: Student[] = [];
const SIN_SESIONES: SesionDelDia[] = [];

export function AttendancePage() {
  const { profile } = useAuth();
  const role = profile?.role;
  if (!role) return <LoadingState />;

  if (role === 'padre') return <ParentAttendance />;
  // Un alumno solo puede leer su propio historial (`findStudentForTenant`):
  // la lista de la categoría le daría 403.
  if (role === 'alumno') return <OwnAttendance studentId={profile.id} nombre={profile.full_name} />;
  return <RollCallScreen />;
}

function RollCallScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const esProfesor = profile?.role === 'profesor';
  const esAdmin = !esProfesor;

  const { data: misCategorias = [] } = useGetMyCategories(esProfesor);
  const { data: todasCategorias = [] } = useGetCategories(!esProfesor);
  const categorias = (esProfesor ? misCategorias : todasCategorias) as {
    id: string;
    name: string;
  }[];

  // El estado de la pantalla vive en la query: así se comparte "el histórico
  // de la Sub-12 a 90 días" y el botón atrás no lo pierde.
  const [estado, setEstado] = useState<EstadoAsistencias>(ESTADO_ASISTENCIAS_INICIAL);
  const [listo, setListo] = useState(false);
  const [marcas, setMarcas] = useState<MarcasPorAlumno>({});
  const [sucio, setSucio] = useState(false);
  const [sesionId, setSesionId] = useState<string | null>(null);

  useEffect(() => {
    setEstado(leerEstadoDeUrl(params.toString()));
    setListo(true);
  }, [params]);

  const fecha = estado.fecha || dayjs().format('YYYY-MM-DD');
  const categoriaId = estado.categoria;

  const aplicar = useCallback(
    (cambios: Partial<EstadoAsistencias>) => {
      setEstado((previo) => {
        const siguiente = { ...previo, ...cambios };
        window.history.replaceState(null, '', `/attendance${escribirEstadoEnUrl(siguiente)}`);
        return siguiente;
      });
    },
    [],
  );

  /** Cambiar de lista con marcas sin guardar pide confirmación. */
  const cambiarContexto = (cambios: Partial<EstadoAsistencias>) => {
    const hacerlo = () => {
      setMarcas({});
      setSucio(false);
      setSesionId(null);
      aplicar(cambios);
    };
    if (!sucio) return hacerlo();
    modals.openConfirmModal({
      title: 'Hay marcas sin guardar',
      children: (
        <Text size="sm">
          Si cambias de categoría, fecha o tipo de sesión se perderá el pase de lista que no has
          guardado.
        </Text>
      ),
      labels: { confirm: 'Descartar y cambiar', cancel: 'Seguir aquí' },
      confirmProps: { color: 'red' },
      onConfirm: hacerlo,
    });
  };

  const { data: alumnosData, isLoading: cargandoAlumnos } = useGetStudents(
    categoriaId || undefined,
    !!categoriaId,
  );
  const { data: delDiaData } = useGetAttendancesByCategory(categoriaId || '', fecha);
  const { data: historialData } = useGetAttendancesByCategory(categoriaId || '');
  const { data: sesionesData, isLoading: cargandoSesiones } = useGetTrainings({
    category_id: categoriaId || undefined,
    date: categoriaId ? fecha : undefined,
  });
  const alumnos = (alumnosData as Student[] | undefined) ?? SIN_ALUMNOS;
  const delDia = (delDiaData as Attendance[] | undefined) ?? SIN_REGISTROS;
  const historial = (historialData as Attendance[] | undefined) ?? SIN_REGISTROS;
  const sesiones = (sesionesData as SesionDelDia[] | undefined) ?? SIN_SESIONES;
  const save = useSaveAttendances();
  const checkAchievements = useCheckAchievements();

  const guardadas = useMemo(
    () => marcasDeRegistros(delDia, estado.tipo, fecha),
    [delDia, estado.tipo, fecha],
  );
  const yaGuardado = Object.keys(guardadas).length > 0;
  const guardadoEn = useMemo(() => {
    const fechas = (delDia as Attendance[])
      .filter((r) => r.type === estado.tipo)
      .map((r) => r.created_at)
      .filter(Boolean)
      .sort();
    return fechas.at(-1) || null;
  }, [delDia, estado.tipo]);

  // Lo guardado se precarga, pero nunca encima de lo que el profesor ya marcó.
  useEffect(() => {
    if (sucio) return;
    setMarcas((previo) => (mismasMarcas(previo, guardadas) ? previo : guardadas));
  }, [guardadas, sucio]);

  // Elige la sesión agendada del día en cuanto se conoce.
  useEffect(() => {
    const delTipo = sesiones.filter((s) => !s.type || s.type === estado.tipo);
    setSesionId((previo) =>
      previo && delTipo.some((s) => s.id === previo) ? previo : delTipo[0]?.id || null,
    );
  }, [sesiones, estado.tipo]);

  // Avisa antes de perder el pase de lista al recargar o cerrar la pestaña.
  useEffect(() => {
    if (!sucio) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [sucio]);

  const estadisticas = useMemo(() => {
    const previos = historial.filter(
      (r) => dayjs(r.date).format('YYYY-MM-DD') !== fecha,
    );
    return new Map(estadisticasPorAlumno(previos).map((e) => [e.studentId, e]));
  }, [historial, fecha]);

  /**
   * A quién cubre este pase de lista. Los inactivos quedan fuera salvo que
   * alguien los marque a mano: el backend borra y reinserta por alumno, así
   * que mandarlos sin marca los daría por ausentes en silencio.
   */
  const delPase = useMemo(
    () =>
      alumnos.filter(
        (a) => normalizarEstado(a.status) !== 'inactivo' || marcas[a.id] !== undefined,
      ),
    [alumnos, marcas],
  );
  const resumen = useMemo(() => resumirPaseLista(delPase, marcas), [delPase, marcas]);

  const marcar = (studentId: string, marca: Marca) => {
    setSucio(true);
    setMarcas((previo) => {
      const siguiente = { ...previo };
      if (marca === 'sin_marcar') delete siguiente[studentId];
      else siguiente[studentId] = marca === 'presente';
      return siguiente;
    });
  };

  const marcarVarios = (ids: string[], marca: Marca) => {
    setSucio(true);
    setMarcas((previo) => {
      const siguiente = { ...previo };
      for (const id of ids) {
        if (marca === 'sin_marcar') delete siguiente[id];
        else siguiente[id] = marca === 'presente';
      }
      return siguiente;
    });
  };

  const enviar = () => {
    if (!categoriaId) return;
    const presentes = resumen.presentes;
    const total = resumen.total;
    const ids = delPase.filter((a) => marcaDe(marcas, a.id) === 'presente').map((a) => a.id);
    // Sin red la promesa de la mutación no resuelve hasta que vuelva la conexión:
    // se pregunta antes de lanzar para poder decir la verdad en el aviso.
    const enCola = willQueueOffline();

    save.mutate(
      {
        category_id: categoriaId,
        date: fecha,
        type: estado.tipo,
        training_id: sesionId || undefined,
        records: delPase.map((a) => ({
          student_id: a.id,
          present: marcaDe(marcas, a.id) === 'presente',
        })),
      },
      {
        onSuccess: () => {
          setSucio(false);
          notifications.show({
            color: 'green',
            title: 'Pase de lista guardado',
            message: `${presentes} presentes y ${total - presentes} ausentes el ${dayjs(fecha).format('DD/MM/YYYY')}.`,
          });
          // Si el envío salió desde la cola tras recargar, este callback ya no
          // existe; los logros se recalculan en la siguiente visita.
          for (const id of ids) checkAchievements.mutate(id);
        },
        onError: (error) => {
          notifications.show({
            color: 'red',
            title: 'No se pudo guardar el pase de lista',
            message: mensajeDeError(error, 'Revisa tu conexión e inténtalo de nuevo.'),
          });
        },
      },
    );

    if (enCola) {
      setSucio(false);
      notifications.show({
        color: 'orange',
        title: 'Guardado sin conexión',
        message: 'El pase de lista se enviará solo en cuanto haya señal. No cierres sesión.',
      });
    }
  };

  const guardar = () => {
    if (resumen.sinMarcar === 0) return enviar();
    // «Sin marcar» no existe en la base: hay que decir qué se va a guardar.
    modals.openConfirmModal({
      title: `${resumen.sinMarcar} ${resumen.sinMarcar === 1 ? 'alumno' : 'alumnos'} sin marcar`,
      children: (
        <Stack gap="xs">
          <Text size="sm">
            Se guardarán como <strong>ausentes</strong>: la asistencia solo distingue entre
            presente y ausente.
          </Text>
          <Text size="sm" c="dimmed">
            Si alguno no debía estar en la lista, márcalo presente o déjalo para después.
          </Text>
        </Stack>
      ),
      labels: { confirm: 'Guardar como ausentes', cancel: 'Seguir marcando' },
      onConfirm: () => void enviar(),
    });
  };

  const categoria = categorias.find((c) => c.id === categoriaId);

  if (!listo) return <LoadingState />;

  const selector = (
    <Card withBorder padding="lg" radius="md">
      <Select
        label="Categoría"
        placeholder="Elige la categoría"
        searchable
        nothingFoundMessage="Sin coincidencias"
        value={categoriaId}
        onChange={(valor) => cambiarContexto({ categoria: valor })}
        data={categorias.map((c) => ({ value: c.id, label: c.name }))}
      />
    </Card>
  );

  return (
    <>
      <PageHeader
        title="Asistencias"
        description="Pasa lista en la cancha y detecta a quién estás perdiendo."
        actions={
          categoria ? (
            <Badge size="lg" variant="light">
              {categoria.name}
            </Badge>
          ) : undefined
        }
      />

      <Tabs
        value={estado.vista}
        onChange={(valor) => valor && aplicar({ vista: valor as EstadoAsistencias['vista'] })}
        mb="md"
        keepMounted={false}
      >
        <Tabs.List>
          <Tabs.Tab value="pase" leftSection={<IconClipboardList size={16} />}>
            Pase de lista
          </Tabs.Tab>
          <Tabs.Tab value="historico" leftSection={<IconChartBar size={16} />}>
            Histórico
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {estado.vista === 'historico' ? (
        <Stack gap="md">
          {selector}
          {!categoriaId ? (
            <Card withBorder radius="md">
              <EmptyState
                title="Elige una categoría"
                description="El histórico muestra la asistencia de una categoría: quién viene, quién está faltando y cómo salió cada sesión."
                icon={<IconChartBar size={32} />}
              />
            </Card>
          ) : (
            <CategoryAttendanceHistory
              categoryId={categoriaId}
              categoriaNombre={categoria?.name}
              periodo={estado.periodo}
              onPeriodo={(periodo: Periodo) => aplicar({ periodo })}
              vista={estado.detalle}
              onVista={(detalle: VistaHistorico) => aplicar({ detalle })}
              onAbrirSesion={(dia, tipo) =>
                cambiarContexto({ vista: 'pase', fecha: dia, tipo })
              }
              onAbrirAlumno={(studentId) => router.push(`/admin/students/${studentId}`)}
            />
          )}
        </Stack>
      ) : (
        <Stack gap="md">
          <AttendanceSessionBar
            categorias={categorias}
            categoriaId={categoriaId}
            onCategoria={(valor) => cambiarContexto({ categoria: valor })}
            fecha={fecha}
            onFecha={(valor) => cambiarContexto({ fecha: valor })}
            tipo={estado.tipo}
            onTipo={(tipo: TipoSesion) => cambiarContexto({ tipo })}
            sesiones={sesiones}
            sesionId={sesionId}
            onSesion={setSesionId}
            cargandoSesiones={cargandoSesiones}
          />

          {!categoriaId ? (
            <Card withBorder radius="md">
              <EmptyState
                title="Elige una categoría"
                description="Aparecerán sus alumnos para marcar quién vino hoy."
                icon={<IconCalendarCheck size={32} />}
              />
            </Card>
          ) : cargandoAlumnos ? (
            <LoadingState label="Cargando la lista…" />
          ) : alumnos.length === 0 ? (
            <Card withBorder radius="md">
              <EmptyState
                title="Sin alumnos en esta categoría"
                description="Da de alta alumnos o muévelos a esta categoría para poder pasar lista."
              />
            </Card>
          ) : (
            <>
              {yaGuardado && !sucio && (
                <Alert variant="light" color="blue" py="xs">
                  Ya hay un pase de lista guardado para el{' '}
                  {dayjs(fecha).format('DD/MM/YYYY')} ({etiquetaTipo(estado.tipo).toLowerCase()}).
                  Lo que cambies aquí lo reemplaza.
                </Alert>
              )}
              {dayjs(fecha).isAfter(dayjs(), 'day') && (
                <Alert
                  variant="light"
                  color="orange"
                  icon={<IconAlertTriangle size={18} />}
                  py="xs"
                >
                  Estás pasando lista de una fecha futura.
                </Alert>
              )}
              <RollCallResumen resumen={resumen} />
              <RollCallList
                alumnos={alumnos}
                marcas={marcas}
                onMarca={marcar}
                onMasivo={marcarVarios}
                estadisticas={estadisticas}
                puedeVerEstado={esAdmin}
                onAbrirAlumno={(alumno) => router.push(`/admin/students/${alumno.id}`)}
              />
              <RollCallBarraGuardado
                resumen={resumen}
                sucio={sucio}
                guardado={yaGuardado}
                guardadoEn={guardadoEn}
                guardando={save.isPending && !save.isPaused}
                onGuardar={guardar}
                onDescartar={() => {
                  setMarcas(guardadas);
                  setSucio(false);
                }}
              />
            </>
          )}
        </Stack>
      )}
    </>
  );
}

function ParentAttendance() {
  const { data: children = [], isLoading } = useGetMyChildren();
  const [studentId, setStudentId] = useState<string | null>(null);
  const hijos = children as { id: string; full_name: string }[];

  // Con un solo hijo no hay nada que elegir.
  const elegido = studentId || (hijos.length === 1 ? hijos[0].id : null);
  const hijo = hijos.find((c) => c.id === elegido);

  return (
    <>
      <PageHeader title="Asistencias" description="Cuánto está asistiendo cada hijo/a" />
      {hijos.length > 1 && (
        <Card withBorder padding="md" radius="md" mb="md">
          <Select
            label="Hijo/a"
            placeholder="Selecciona"
            value={elegido}
            onChange={setStudentId}
            data={hijos.map((c) => ({ value: c.id, label: c.full_name }))}
          />
        </Card>
      )}
      {isLoading ? (
        <LoadingState />
      ) : hijos.length === 0 ? (
        <Card withBorder radius="md">
          <EmptyState
            title="Sin hijos vinculados"
            description="Pide a la academia que vincule a tus hijos con tu cuenta."
          />
        </Card>
      ) : !elegido ? (
        <Card withBorder radius="md">
          <EmptyState description="Selecciona un hijo/a para ver su historial." />
        </Card>
      ) : (
        <StudentAttendanceHistory studentId={elegido} nombre={hijo?.full_name} />
      )}
    </>
  );
}

function OwnAttendance({ studentId, nombre }: { studentId: string; nombre?: string | null }) {
  return (
    <>
      <PageHeader title="Mi asistencia" description="Cuánto has venido a entrenar" />
      <StudentAttendanceHistory studentId={studentId} nombre={nombre} />
    </>
  );
}
