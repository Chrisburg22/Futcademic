import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
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
import { AuthLayout } from '../../components/auth/AuthLayout';

export function StudentLoginPage() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { username: '', password: '' },
    validateInputOnBlur: true,
    validate: {
      username: (v) => (v.trim().length >= 2 ? null : 'Escribe tu usuario'),
      password: (v) => (!v ? 'Escribe tu contraseña' : v.length >= 6 ? null : 'Mínimo 6 caracteres'),
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
        setError('Usuario o contraseña incorrectos.');
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
    <AuthLayout
      title="Acceso alumno"
      subtitle="Entra con el usuario que te dio tu academia."
      footer={
        <Text fz="sm" ta="center" c="dimmed">
          ¿Eres administrador o profesor?{' '}
          <Anchor component={Link} to="/login" fw={500}>
            Inicia sesión aquí
          </Anchor>
        </Text>
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
            label="Usuario"
            placeholder="tu_usuario"
            autoComplete="username"
            autoCapitalize="none"
            autoFocus
            size="md"
            required
            withAsterisk={false}
            {...form.getInputProps('username')}
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
          <Button type="submit" loading={submitting} size="md" fullWidth mt="xs">
            Entrar
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
