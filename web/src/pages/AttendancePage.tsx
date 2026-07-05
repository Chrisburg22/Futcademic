import { useState, useEffect } from 'react';
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
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
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

export function AttendancePage() {
  const { profile } = useAuth();
  const role = profile?.role;
  if (!role) return <LoadingState />;

  if (role === 'padre') return <ParentAttendance />;
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
  const { data: children = [] } = useGetMyChildren();
  const [studentId, setStudentId] = useState<string | null>(null);
  const { data: history = [], isLoading } = useGetAttendancesByStudent(studentId || undefined);

  return (
    <>
      <PageHeader title="Asistencias" description="Historial de tus hijos" />
      <Card withBorder padding="md" radius="md" mb="md">
        <Select
          label="Hijo/a"
          placeholder="Selecciona"
          value={studentId}
          onChange={setStudentId}
          data={children.map((c: any) => ({ value: c.id, label: c.full_name }))}
        />
      </Card>
      {!studentId ? (
        <EmptyState description="Selecciona un hijo/a para ver su historial." />
      ) : isLoading ? (
        <LoadingState />
      ) : history.length === 0 ? (
        <EmptyState description="Sin registros de asistencia." />
      ) : (
        <Stack>
          {history.map((a: any) => (
            <Card key={a.id} withBorder padding="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>{dayjs(a.date).format('DD MMM YYYY')}</Text>
                  <Text size="xs" c="dimmed" tt="capitalize">
                    {a.type}
                  </Text>
                </div>
                <Badge color={a.present ? 'green' : 'red'}>
                  {a.present ? 'Presente' : 'Ausente'}
                </Badge>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
}
