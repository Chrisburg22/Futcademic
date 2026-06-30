import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Anchor,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Correo inválido'),
      password: (v) => (v.length >= 6 ? null : 'Mínimo 6 caracteres'),
    },
  });

  if (!isLoading && session) return <Navigate to="/" replace />;

  const onSubmit = async (values: typeof form.values) => {
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <Container size={420} my={80}>
      <Stack gap="xs" align="center" mb="lg">
        <Title order={2}>Futcamedic</Title>
        <Text c="dimmed" size="sm">
          Inicia sesión para continuar
        </Text>
      </Stack>
      <Paper withBorder shadow="sm" p="xl" radius="md">
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack>
            {error && (
              <Alert color="red" icon={<IconAlertCircle size={16} />}>
                {error}
              </Alert>
            )}
            <TextInput
              label="Correo"
              placeholder="tu@correo.com"
              autoComplete="email"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Contraseña"
              autoComplete="current-password"
              required
              {...form.getInputProps('password')}
            />
            <Button type="submit" loading={submitting} fullWidth>
              Entrar
            </Button>
            <Text size="sm" ta="center">
              ¿No tienes cuenta?{' '}
              <Anchor component={Link} to="/register">
                Registra tu academia
              </Anchor>
            </Text>
            <Text size="sm" ta="center">
              <Anchor component={Link} to="/student-login">
                Acceso alumno
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
