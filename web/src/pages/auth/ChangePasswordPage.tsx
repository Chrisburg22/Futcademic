import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordInput, Button, Stack, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useChangePassword } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';

export function ChangePasswordPage() {
  const { refreshProfile } = useAuth();
  const change = useChangePassword();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    validateInputOnBlur: true,
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
    <AuthLayout
      title="Cambia tu contraseña"
      subtitle="Por seguridad debes establecer una contraseña nueva antes de continuar."
    >
      <form onSubmit={form.onSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
              {error}
            </Alert>
          )}
          <PasswordInput
            label="Nueva contraseña"
            description="Al menos 6 caracteres."
            autoComplete="new-password"
            autoFocus
            size="md"
            required
            withAsterisk={false}
            {...form.getInputProps('newPassword')}
          />
          <PasswordInput
            label="Confirmar contraseña"
            autoComplete="new-password"
            size="md"
            required
            withAsterisk={false}
            {...form.getInputProps('confirm')}
          />
          <Button type="submit" loading={change.isPending} size="md" fullWidth mt="xs">
            Guardar
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
