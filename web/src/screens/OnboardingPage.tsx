'use client';

import { Alert, Card, Stack, TextInput, Title, Text, Container } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useUpdateOwnProfile, useCompleteOnboarding } from '../hooks/useMe';
import { ActionBar } from '../components/common/ActionBar';
import { mensajeDeError } from '../lib/categories';

const FORM_ID = 'onboarding';

/**
 * Único paso antes de entrar: nombre, apellido y teléfono.
 *
 * `mutateAsync` iba sin `catch`, así que un fallo de red dejaba el formulario
 * mudo: el usuario volvía a pulsar «Continuar» sin saber qué pasaba. El botón
 * baja además a `ActionBar`, al alcance del pulgar y por encima del área segura.
 */
export function OnboardingPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useRouter();
  const updateProfile = useUpdateOwnProfile();
  const complete = useCompleteOnboarding();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      firstName: profile?.full_name?.split(' ')[0] || '',
      lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
      phone: (profile as any)?.phone || '',
    },
    validate: {
      firstName: (v) => (v.trim() ? null : 'Escribe tu nombre'),
      lastName: (v) => (v.trim() ? null : 'Escribe tu apellido'),
    },
  });

  const onSubmit = async (v: typeof form.values) => {
    setError(null);
    try {
      await updateProfile.mutateAsync({
        firstName: v.firstName,
        lastName: v.lastName,
        phone: v.phone || undefined,
      });
      await complete.mutateAsync();
      await refreshProfile();
      notifications.show({ color: 'green', message: '¡Bienvenido!' });
      navigate.replace('/');
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos guardar tus datos. Inténtalo de nuevo.'));
    }
  };

  const enviando = updateProfile.isPending || complete.isPending;

  return (
    <Container size={420} py="xl">
      <Stack gap="xs" align="center" mb="lg">
        <Title order={2}>Completa tu perfil</Title>
        <Text c="dimmed" size="sm">
          Un paso más antes de comenzar
        </Text>
      </Stack>

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={18} />} mb="md" role="alert">
          {error}
        </Alert>
      )}

      <Card withBorder shadow="sm" p="xl" radius="md">
        <form id={FORM_ID} onSubmit={form.onSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label="Nombre"
              required
              autoCapitalize="words"
              autoComplete="given-name"
              {...form.getInputProps('firstName')}
            />
            <TextInput
              label="Apellido"
              required
              autoCapitalize="words"
              autoComplete="family-name"
              {...form.getInputProps('lastName')}
            />
            <TextInput
              label="Teléfono (opcional)"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              {...form.getInputProps('phone')}
            />
          </Stack>
        </form>
      </Card>

      <ActionBar primary={{ label: 'Continuar', type: 'submit', form: FORM_ID, loading: enviando }} />
    </Container>
  );
}
