import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Group,
  Select,
  Stack,
  Switch,
  Button,
  Text,
  Badge,
  Title,
  SegmentedControl,
  Tabs,
  Avatar,
  ThemeIcon,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import {
  useGetAttendancesByCategory,
  useGetAttendancesByStudent,
  useSaveAttendances,
  useMarkTrainingComplete,
} from '../hooks/useAttendances';
import { useCheckAchievements } from '../hooks/useAchievements';
import { useGetMyCategories, useGetCategories } from '../hooks/useCategories';
import { useGetStudents, useGetMyChildren } from '../hooks/useStudents';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { CategoryAttendanceHistory } from '../components/attendance/CategoryAttendanceHistory';
import { AttendanceStrip, type RegistroAsistencia } from '../components/attendance/AttendanceStrip';
import { ErrorState } from '../components/common/ErrorState';
import { SkeletonPage } from '../components/common/SkeletonPage';
import { TouchRow } from '../components/common/TouchRow';
import { StudentAttendancePage } from './StudentAttendancePage';

export function AttendancePage() {
  const { profile } = useAuth();
  const role = profile?.role;
  if (!role) return <LoadingState />;

  /*
   * Despacho explícito por rol.
   *
   * Antes esto era `if (padre) ... ; return <RollCallView />`, así que **el
   * alumno caía en el pase de lista del profesor**: selector de categoría,
   * fecha, tipo de sesión y un switch por compañero. Ahora cada rol ve lo suyo
   * y un rol nuevo no hereda la pantalla de otro por descuido.
   */
  if (role === 'padre') return <ParentAttendance />;
  if (role === 'alumno') return <StudentAttendancePage />;
  return <RollCallView />;
}

function RollCallView() {
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'profesor';
  const { data: myCategories = [] } = useGetMyCategories(isTeacher);
  const { data: allCategories = [] } = useGetCategories();
  const categories = isTeacher ? myCategories : allCategories;

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(new Date());
  const [type, setType] = useState<'entrenamiento' | 'partido'>('entrenamiento');
  const [marks, setMarks] = useState<Record<string, boolean>>({});

  const dateStr = date ? dayjs(date).format('YYYY-MM-DD') : undefined;
  const { data: students = [], isLoading: loadingStudents } = useGetStudents(
    categoryId || undefined,
  );
  const { data: existing } = useGetAttendancesByCategory(categoryId || '', dateStr);
  const save = useSaveAttendances();
  const checkAchievements = useCheckAchievements();

  useEffect(() => {
    if (!existing) return;
    const map: Record<string, boolean> = {};
    existing.forEach((a: any) => {
      map[a.student_id] = a.present;
    });
    setMarks(map);
  }, [existing]);

  const onSave = async () => {
    if (!categoryId || !dateStr) return;
    await save.mutateAsync({
      category_id: categoryId,
      date: dateStr,
      type,
      records: students.map((s: any) => ({
        student_id: s.id,
        present: !!marks[s.id],
      })),
    });
    notifications.show({ color: 'green', message: 'Asistencias guardadas' });
    const presentIds = students
      .filter((s: any) => marks[s.id])
      .map((s: any) => s.id);
    for (const sid of presentIds) {
      checkAchievements.mutate(sid);
    }
  };

  const [tab, setTab] = useState<string | null>('rollcall');

  return (
    <>
      <PageHeader title="Asistencias" description="Pasa lista y consulta el histórico por categoría" />
      <Tabs value={tab} onChange={setTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="rollcall">Pase de lista</Tabs.Tab>
          <Tabs.Tab value="history">Histórico</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {tab === 'history' ? (
        <>
          <Card withBorder padding="lg" radius="md" mb="md">
            <Select
              label="Categoría"
              placeholder="Selecciona"
              value={categoryId}
              onChange={setCategoryId}
              data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
              searchable
            />
          </Card>
          {!categoryId ? (
            <EmptyState description="Selecciona una categoría para ver su histórico." />
          ) : (
            <CategoryAttendanceHistory categoryId={categoryId} />
          )}
        </>
      ) : (
      <>
      <Card withBorder padding="lg" radius="md" mb="md">
        <Group grow align="flex-end">
          <Select
            label="Categoría"
            placeholder="Selecciona"
            value={categoryId}
            onChange={setCategoryId}
            data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
            searchable
          />
          <DateInput label="Fecha" value={date} onChange={setDate} />
          <SegmentedControl
            value={type}
            onChange={(v) => setType(v as any)}
            data={[
              { label: 'Entrenamiento', value: 'entrenamiento' },
              { label: 'Partido', value: 'partido' },
            ]}
          />
        </Group>
      </Card>

      {!categoryId ? (
        <EmptyState description="Selecciona una categoría para mostrar alumnos." />
      ) : loadingStudents ? (
        <LoadingState />
      ) : students.length === 0 ? (
        <EmptyState description="Sin alumnos en esta categoría." />
      ) : (
        <Card withBorder padding="lg" radius="md">
          <Stack>
            {students.map((s: any) => (
              <Group key={s.id} justify="space-between">
                <div>
                  <Text fw={500}>{s.full_name}</Text>
                  <Text size="xs" c="dimmed">
                    {s.email || '—'}
                  </Text>
                </div>
                <Switch
                  checked={!!marks[s.id]}
                  onChange={(e) =>
                    setMarks((m) => ({ ...m, [s.id]: e.currentTarget.checked }))
                  }
                  label={marks[s.id] ? 'Presente' : 'Ausente'}
                />
              </Group>
            ))}
            <Button onClick={onSave} loading={save.isPending} mt="md">
              Guardar asistencias
            </Button>
          </Stack>
        </Card>
      )}
      </>
      )}
    </>
  );
}

function ParentAttendance() {
  const consulta = useSearchParams();
  const { data: children = [], isLoading: cargandoHijos } = useGetMyChildren();
  /*
   * Llegar desde Inicio con un hijo concreto tiene que funcionar: el enlace del
   * tablero trae `?student_id=`, pero esta pantalla arrancaba en `null` y nunca
   * leía la query, así que el padre caía en un selector vacío. Es el mismo
   * patrón que ya usaba `ParentFinances`.
   */
  const [studentId, setStudentId] = useState<string | null>(() => consulta.get('student_id'));

  // Con un solo hijo no hay nada que elegir.
  useEffect(() => {
    if (studentId) return;
    if (children.length > 0) setStudentId((children[0] as any).id);
  }, [children, studentId]);

  const {
    data: history = [],
    isLoading,
    isError,
    refetch,
  } = useGetAttendancesByStudent(studentId || undefined);

  const hijo = (children as any[]).find((c) => c.id === studentId);

  const ordenados = useMemo(
    () =>
      [...(history as RegistroAsistencia[])].sort(
        (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
      ),
    [history],
  );

  const cabecera = (
    <PageHeader
      title="Asistencias"
      description={hijo ? `Historial de ${hijo.full_name}` : 'Historial de tus hijos'}
    />
  );

  /*
   * Con varios hijos, fichas con avatar en vez de un desplegable: tocar una cara
   * de 44 px es más fácil que abrir un menú y acertar en una línea de lista.
   */
  const selector =
    children.length > 1 ? (
      <Group gap="xs" wrap="nowrap" mb="md" style={{ overflowX: 'auto', paddingBottom: 4 }}>
        {(children as any[]).map((c) => {
          const activo = c.id === studentId;
          return (
            <Button
              key={c.id}
              variant={activo ? 'filled' : 'default'}
              onClick={() => setStudentId(c.id)}
              aria-pressed={activo}
              leftSection={
                <Avatar src={c.avatar_url || undefined} size={24} radius="xl">
                  {c.full_name?.[0]?.toUpperCase()}
                </Avatar>
              }
              style={{ flexShrink: 0 }}
            >
              {c.full_name}
            </Button>
          );
        })}
      </Group>
    ) : null;

  if (cargandoHijos) {
    return (
      <>
        {cabecera}
        <SkeletonPage rows={3} />
      </>
    );
  }

  if (children.length === 0) {
    return (
      <>
        {cabecera}
        <EmptyState
          title="Sin alumnos vinculados"
          description="Cuando la academia registre a tu hijo, aquí verás su asistencia."
          action={
            <Button component={Link} href="/children">
              Vincular hijo
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      {cabecera}
      {selector}
      {isError ? (
        <ErrorState
          title="No pudimos cargar la asistencia"
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <SkeletonPage rows={3} />
      ) : ordenados.length === 0 ? (
        <EmptyState
          title="Todavía no hay sesiones"
          description="Cuando el entrenador pase lista, aquí verás si asistió."
        />
      ) : (
        <Stack gap="md">
          {/* La tendencia de un golpe, antes de las filas: nadie lee cincuenta
              registros para saber si su hijo está yendo. */}
          <Card withBorder padding="lg" radius="md">
            <Stack gap="sm">
              <Text fw={600}>Últimas sesiones</Text>
              <AttendanceStrip registros={ordenados} />
            </Stack>
          </Card>

          <Stack gap="xs">
            {ordenados.map((a, i) => (
              <TouchRow
                key={a.id ?? `${a.date}-${i}`}
                leading={
                  <ThemeIcon
                    size={40}
                    radius="xl"
                    variant="light"
                    color={a.present ? 'teal' : 'red'}
                  >
                    {a.present ? <IconCheck size={20} /> : <IconX size={20} />}
                  </ThemeIcon>
                }
                title={dayjs(a.date).format('dddd D [de] MMMM')}
                subtitle={a.present ? 'Asistió' : 'Faltó'}
                tags={
                  a.type ? (
                    <Badge variant="light" tt="capitalize">
                      {a.type}
                    </Badge>
                  ) : undefined
                }
                withChevron={false}
              />
            ))}
          </Stack>
        </Stack>
      )}
    </>
  );
}
