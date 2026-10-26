import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Redirect } from '@/components/navigation/Redirect';
import {
  TextInput,
  PasswordInput,
  Button,
  Text,
  Stack,
  Group,
  Anchor,
  Alert,
  Divider,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconSchool } from '@tabler/icons-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { InstallButton, useCanInstall } from '../../components/pwa/InstallButton';

export function LoginPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const canInstall = useCanInstall();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validateInputOnBlur: true,
    validate: {
      email: (v) =>
        !v.trim() ? 'Escribe tu correo' : /^\S+@\S+$/.test(v) ? null : 'Correo inválido',
      password: (v) => (!v ? 'Escribe tu contraseña' : v.length >= 6 ? null : 'Mínimo 6 caracteres'),
    },
  });

  if (!isLoading && session) return <Redirect to="/" />;

  const onSubmit = async (values: typeof form.values) => {
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    setSubmitting(false);
    if (error) {
      // El mensaje de Supabase llega en inglés y es el mismo para correo
      // inexistente y contraseña mala; lo traducimos sin dar más pistas.
      setError(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : error.message,
      );
      return;
    }
    router.replace('/');
  };

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Entra con el correo de tu academia."
      footer={
        <Stack gap="sm">
          <Text fz="sm" ta="center" c="dimmed">
            ¿No tienes cuenta?{' '}
            <Anchor component={Link} href="/register" fw={500}>
              Registra tu academia
            </Anchor>
          </Text>
          {/* Instalar sin necesidad de iniciar sesión: muchos padres y alumnos
              llegan aquí desde el móvil y es el mejor momento para ofrecerlo.
              Solo se dibuja si el navegador puede hacerlo. */}
          {canInstall && (
            <>
              <Divider label="¿La usas a diario?" labelPosition="center" />
              <Center>
                <InstallButton />
              </Center>
            </>
          )}
        </Stack>
      }
    >
      <form onSubmit={form.onSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
              {error}
            </Alert>
          )}
          <TextInput
            label="Correo"
            placeholder="tu@correo.com"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            size="md"
            required
            withAsterisk={false}
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Contraseña"
            placeholder="Tu contraseña"
            autoComplete="current-password"
            size="md"
            required
            withAsterisk={false}
            {...form.getInputProps('password')}
          />
          <Group justify="flex-end" mt={-8}>
            <Anchor component={Link} href="/forgot-password" fz="sm">
              ¿Olvidaste tu contraseña?
            </Anchor>
          </Group>
          <Button type="submit" loading={submitting} size="md" fullWidth mt="xs">
            Entrar
          </Button>
          <Divider label="o" labelPosition="center" />
          <Button
            component={Link}
            href="/student-login"
            variant="default"
            size="md"
            fullWidth
            leftSection={<IconSchool size={18} />}
          >
            Acceso alumno
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
