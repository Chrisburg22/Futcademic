import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Group,
  Stack,
  Text,
  Avatar,
  Badge,
  Button,
  Grid,
  ThemeIcon,
  Table,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconFlame,
  IconCalendar,
  IconTrophy,
  IconUsers,
} from '@tabler/icons-react';
import {
  useGetStudentDetails,
  useGetStudentStats,
  useGetStudentTeam,
} from '../../hooks/useStudents';
import { useGetAttendancesByStudent } from '../../hooks/useAttendances';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import dayjs from 'dayjs';

function Stat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card withBorder padding="md" radius="md">
      <Group gap="sm">
        <ThemeIcon size={36} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {label}
          </Text>
          <Text fw={700} size="lg">
            {value}
          </Text>
        </div>
      </Group>
    </Card>
  );
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading } = useGetStudentDetails(id);
  const { data: stats } = useGetStudentStats(id);
  const { data: team } = useGetStudentTeam(id);
  const { data: attendances = [] } = useGetAttendancesByStudent(id);

  if (isLoading) return <LoadingState />;
  if (!student) return <Text>Alumno no encontrado</Text>;

  return (
    <>
      <PageHeader
        title={student.full_name || 'Alumno'}
        actions={
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/admin/students')}
          >
            Volver
          </Button>
        }
      />

      <Card withBorder padding="lg" radius="md" mb="md">
        <Group>
          <Avatar size="xl" radius="xl" src={student.avatar_url || undefined}>
            {student.full_name?.[0]?.toUpperCase()}
          </Avatar>
          <Stack gap={4}>
            <Text fw={700} size="lg">
              {student.full_name}
            </Text>
            <Text size="sm" c="dimmed">
              {student.email || '—'}
            </Text>
            <Group gap="xs">
              <Badge variant="light">{student.category?.name || 'Sin categoría'}</Badge>
              <Badge variant="light" color={student.status === 'activo' ? 'green' : 'orange'}>
                {student.status || 'activo'}
              </Badge>
            </Group>
            {student.birth_date && (
              <Text size="sm">
                Nacimiento: {dayjs(student.birth_date).format('DD/MM/YYYY')}
              </Text>
            )}
          </Stack>
        </Group>
      </Card>

      {stats && (
        <Grid mb="md">
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Stat
              label="Racha actual"
              value={stats.currentStreak}
              icon={<IconFlame size={18} />}
              color="orange"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Stat
              label="Racha máxima"
              value={stats.maxStreak}
              icon={<IconFlame size={18} />}
              color="red"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Stat
              label="Este mes"
              value={`${stats.attendedThisMonth}/${stats.trainingsThisMonth}`}
              icon={<IconCalendar size={18} />}
              color="blue"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Stat
              label="Logros"
              value={`${stats.achievementsUnlocked}/${stats.totalAchievements}`}
              icon={<IconTrophy size={18} />}
              color="yellow"
            />
          </Grid.Col>
        </Grid>
      )}

      {team && (
        <Card withBorder padding="lg" radius="md" mb="md">
          <Group gap="xs" mb="sm">
            <IconUsers size={18} />
            <Text fw={600}>{team.teamName || 'Equipo'}</Text>
          </Group>
          <Text size="sm" mb="xs" c="dimmed">
            Compañeros
          </Text>
          <Group gap="xs" mb="sm">
            {(team.teammates || []).map((t: any) => (
              <Badge key={t.id} variant="light">
                {t.full_name}
              </Badge>
            ))}
            {(team.teammates || []).length === 0 && (
              <Text size="sm" c="dimmed">
                —
              </Text>
            )}
          </Group>
          <Text size="sm" mb="xs" c="dimmed">
            Profesores
          </Text>
          <Group gap="xs">
            {(team.teachers || []).map((t: any) => (
              <Badge key={t.id} variant="light" color="violet">
                {t.full_name}
              </Badge>
            ))}
          </Group>
        </Card>
      )}

      <Card withBorder padding={0} radius="md">
        <Text fw={600} p="md" pb={0}>
          Historial de asistencia
        </Text>
        {attendances.length === 0 ? (
          <Text p="md" c="dimmed" size="sm">
            Sin registros
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={400}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Asistió</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {attendances.slice(0, 50).map((a: any) => (
                  <Table.Tr key={a.id}>
                    <Table.Td>{dayjs(a.date).format('DD/MM/YYYY')}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm" tt="capitalize">
                        {a.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={a.present ? 'green' : 'red'} variant="light" size="sm">
                        {a.present ? 'Sí' : 'No'}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>
    </>
  );
}
