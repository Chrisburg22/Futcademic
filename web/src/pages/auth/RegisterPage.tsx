import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import axios from 'axios';
import { AuthLayout } from '../../components/auth/AuthLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      schoolName: '',
      fullName: '',
      email: '',
      password: '',
    },
    validate: {
      schoolName: (v) => (v.length >= 2 ? null : 'Requerido'),
      fullName: (v) => (v.length >= 2 ? null : 'Requerido'),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Correo inválido'),
      password: (v) => (v.length >= 6 ? null : 'Mínimo 6 caracteres'),
    },
  });

  const onSubmit = async (values: typeof form.values) => {
    setSubmitting(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/auth/register`, values);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || 'Error al registrar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Registra tu academia"
      subtitle="Crea tu cuenta de administrador. Después podrás invitar a tu equipo."
      footer={
        <Text fz="sm" ta="center" c="dimmed">
          ¿Ya tienes cuenta?{' '}
          <Anchor component={Link} to="/login" fw={500}>
            Inicia sesión
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
          {success && (
            <Alert color="green" icon={<IconCheck size={16} />} role="status">
              Academia creada. Redirigiendo...
            </Alert>
          )}
          <TextInput
            label="Nombre de la academia"
            placeholder="Club Deportivo Los Pinos"
            autoFocus
            size="md"
            required
            withAsterisk={false}
            {...form.getInputProps('schoolName')}
          />
          <TextInput
            label="Tu nombre completo"
            placeholder="Nombre y apellidos"
            autoComplete="name"
            size="md"
            required
            withAsterisk={false}
            {...form.getInputProps('fullName')}
          />
          <TextInput
            label="Correo"
            placeholder="tu@correo.com"
            type="email"
            inputMode="email"
            autoComplete="email"
            size="md"
            required
            withAsterisk={false}
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Contraseña"
            description="Al menos 6 caracteres."
            autoComplete="new-password"
            size="md"
            required
            withAsterisk={false}
            {...form.getInputProps('password')}
          />
          <Button type="submit" loading={submitting} size="md" fullWidth mt="xs">
            Crear academia
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
