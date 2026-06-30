import { Card, Stack, TextInput, Button, Title, Text, Container } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUpdateOwnProfile, useCompleteOnboarding } from '../hooks/useMe';

export function OnboardingPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useUpdateOwnProfile();
  const complete = useCompleteOnboarding();

  const form = useForm({
    initialValues: {
      firstName: profile?.full_name?.split(' ')[0] || '',
      lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
      phone: (profile as any)?.phone || '',
    },
  });

  const onSubmit = async (v: typeof form.values) => {
    await updateProfile.mutateAsync({
      firstName: v.firstName,
      lastName: v.lastName,
      phone: v.phone || undefined,
    });
    await complete.mutateAsync();
    await refreshProfile();
    notifications.show({ color: 'green', message: '¡Bienvenido!' });
    navigate('/', { replace: true });
  };

  return (
    <Container size={420} my={80}>
      <Stack gap="xs" align="center" mb="lg">
        <Title order={2}>Completa tu perfil</Title>
        <Text c="dimmed" size="sm">
          Un paso más antes de comenzar
        </Text>
      </Stack>
      <Card withBorder shadow="sm" p="xl" radius="md">
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack>
            <TextInput label="Nombre" required {...form.getInputProps('firstName')} />
            <TextInput label="Apellido" required {...form.getInputProps('lastName')} />
            <TextInput label="Teléfono (opcional)" {...form.getInputProps('phone')} />
            <Button
              type="submit"
              loading={updateProfile.isPending || complete.isPending}
              fullWidth
            >
              Continuar
            </Button>
          </Stack>
        </form>
      </Card>
    </Container>
  );
}
