import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useChangePassword } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';

export function ChangePasswordPage() {
  const { refreshProfile } = useAuth();
  const change = useChangePassword();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { newPassword: '', confirm: '' },
    validate: {
      newPassword: (v) => (v.length >= 6 ? null : 'Mínimo 6 caracteres'),
      confirm: (v, vals) => (v === vals.newPassword ? null : 'No coinciden'),
    },
  });

  const onSubmit = async (values: typeof form.values) => {
    setError(null);
    try {
      await change.mutateAsync(values.newPassword);
      await refreshProfile();
      navigate('/', { replace: true });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  return (
    <Container size={420} my={80}>
      <Stack gap="xs" align="center" mb="lg">
        <Title order={3}>Cambia tu contraseña</Title>
        <Text c="dimmed" size="sm" ta="center">
          Por seguridad debes establecer una nueva contraseña antes de continuar.
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
            <PasswordInput
              label="Nueva contraseña"
              required
              {...form.getInputProps('newPassword')}
            />
            <PasswordInput
              label="Confirmar contraseña"
              required
              {...form.getInputProps('confirm')}
            />
            <Button type="submit" loading={change.isPending} fullWidth>
              Guardar
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
