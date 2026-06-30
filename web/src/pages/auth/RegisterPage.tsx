import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
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
    <Container size={460} my={60}>
      <Stack gap="xs" align="center" mb="lg">
        <Title order={2}>Registrar academia</Title>
        <Text c="dimmed" size="sm">
          Crea tu cuenta de administrador
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
            {success && (
              <Alert color="green" icon={<IconCheck size={16} />}>
                Academia creada. Redirigiendo...
              </Alert>
            )}
            <TextInput
              label="Nombre de la academia"
              required
              {...form.getInputProps('schoolName')}
            />
            <TextInput
              label="Tu nombre completo"
              required
              {...form.getInputProps('fullName')}
            />
            <TextInput
              label="Correo"
              type="email"
              required
              autoComplete="email"
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Contraseña"
              required
              autoComplete="new-password"
              {...form.getInputProps('password')}
            />
            <Button type="submit" loading={submitting} fullWidth>
              Crear academia
            </Button>
            <Text size="sm" ta="center">
              ¿Ya tienes cuenta?{' '}
              <Anchor component={Link} to="/login">
                Inicia sesión
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
