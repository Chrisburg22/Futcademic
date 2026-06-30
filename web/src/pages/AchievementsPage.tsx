import { Card, Group, Stack, Text, Badge, Grid, ThemeIcon } from '@mantine/core';
import { IconTrophy, IconLock } from '@tabler/icons-react';
import { useGetAchievements } from '../hooks/useAchievements';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';

export function AchievementsPage() {
  const { data, isLoading } = useGetAchievements();

  return (
    <>
      <PageHeader
        title="Logros"
        description={
          data
            ? `${data.unlockedCount} de ${data.totalCount} desbloqueados`
            : undefined
        }
      />
      {isLoading ? (
        <LoadingState />
      ) : !data || data.achievements.length === 0 ? (
        <EmptyState description="No hay logros disponibles." />
      ) : (
        <Grid>
          {data.achievements.map((a) => (
            <Grid.Col key={a.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card
                withBorder
                padding="lg"
                radius="md"
                style={{ opacity: a.unlocked ? 1 : 0.55 }}
              >
                <Group gap="sm">
                  <ThemeIcon
                    size={40}
                    radius="md"
                    variant="light"
                    color={a.unlocked ? 'yellow' : 'gray'}
                  >
                    {a.unlocked ? <IconTrophy size={20} /> : <IconLock size={20} />}
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Text fw={600}>{a.name}</Text>
                    {a.description && (
                      <Text size="xs" c="dimmed">
                        {a.description}
                      </Text>
                    )}
                  </Stack>
                </Group>
                {a.unlocked && a.unlocked_at && (
                  <Badge variant="light" color="green" mt="xs" size="xs">
                    Desbloqueado {new Date(a.unlocked_at).toLocaleDateString()}
                  </Badge>
                )}
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}
    </>
  );
}
