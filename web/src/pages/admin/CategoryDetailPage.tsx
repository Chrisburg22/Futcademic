import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Group,
  Stack,
  Table,
  Tabs,
  Text,
  Badge,
  Avatar,
  ActionIcon,
  Button,
} from '@mantine/core';
import { IconArrowLeft, IconEye } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useGetCategories } from '../../hooks/useCategories';
import { useGetStudents } from '../../hooks/useStudents';
import { useGetEvents } from '../../hooks/useEvents';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { CategoryAttendanceHistory } from '../../components/attendance/CategoryAttendanceHistory';

export function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: categories = [], isLoading: loadingCategory } = useGetCategories();
  const category = categories.find((c: any) => c.id === id);

  const { data: students = [], isLoading: loadingStudents } = useGetStudents(id);
  const { data: events = [], isLoading: loadingEvents } = useGetEvents({ category_id: id });

  if (loadingCategory) return <LoadingState />;
  if (!category) return <EmptyState description="Categoría no encontrada." />;

  return (
    <>
      <PageHeader
        title={category.name}
        description={`Año(s): ${category.birth_year || '—'}`}
        actions={
          <Button
            variant="default"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/admin/categories')}
          >
            Volver
          </Button>
        }
      />

      <Group mb="md" gap="xs">
        <Badge variant="light">{students.length} alumnos</Badge>
        {category.teacher?.full_name && (
          <Badge variant="light" color="grape">
            Prof. {category.teacher.full_name}
          </Badge>
        )}
        {category.monthly_fee != null && (
          <Badge variant="light" color="teal">
            Mensualidad ${category.monthly_fee}
          </Badge>
        )}
      </Group>

      <Tabs defaultValue="students">
        <Tabs.List>
          <Tabs.Tab value="students">Alumnos</Tabs.Tab>
          <Tabs.Tab value="agenda">Agenda</Tabs.Tab>
          <Tabs.Tab value="attendance">Asistencias</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="students" pt="md">
          {loadingStudents ? (
            <LoadingState />
          ) : students.length === 0 ? (
            <EmptyState description="Sin alumnos en esta categoría." />
          ) : (
            <Card withBorder padding={0} radius="md">
              <Table.ScrollContainer minWidth={500}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Alumno</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {students.map((s: any) => (
                      <Table.Tr key={s.id}>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar size="sm" radius="xl">
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
                          <ActionIcon
                            variant="subtle"
                            onClick={() => navigate(`/admin/students/${s.id}`)}
                            aria-label="Ver detalle"
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Card>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="agenda" pt="md">
          {loadingEvents ? (
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
