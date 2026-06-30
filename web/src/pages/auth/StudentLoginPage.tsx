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
import { api } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export function StudentLoginPage() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { username: '', password: '' },
    validate: {
      username: (v) => (v.length >= 2 ? null : 'Usuario requerido'),
      password: (v) => (v.length >= 6 ? null : 'Mínimo 6 caracteres'),
    },
  });

  if (!isLoading && session) return <Navigate to="/" replace />;

  const onSubmit = async (values: typeof form.values) => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/resolve-student', {
        username: values.username,
      });
      const email = data.email;
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });
      if (authErr) {
        setError(authErr.message);
        return;
      }
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Usuario no encontrado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size={420} my={80}>
      <Stack gap="xs" align="center" mb="lg">
        <Title order={2}>Acceso Alumno</Title>
        <Text c="dimmed" size="sm">
          Ingresa con tu usuario de alumno
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
              label="Usuario"
              placeholder="tu_usuario"
              autoComplete="username"
              required
              {...form.getInputProps('username')}
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
              ¿Eres administrador?{' '}
              <Anchor component={Link} to="/login">
                Inicia aquí
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
