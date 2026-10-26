import { useState } from 'react';
import { Card, Stack, PasswordInput, Button, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useChangePassword } from '../../hooks/useUsers';
import { PageHeader } from '../../components/common/PageHeader';

export function SecurityPage() {
  const change = useChangePassword();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { newPassword: '', confirm: '' },
    validate: {
      newPassword: (v) => (v.length >= 6 ? null : 'Mínimo 6 caracteres'),
      confirm: (v, vals) => (v === vals.newPassword ? null : 'No coinciden'),
    },
  });

  const onSubmit = async (v: typeof form.values) => {
    setError(null);
    try {
      await change.mutateAsync(v.newPassword);
      notifications.show({ color: 'green', message: 'Contraseña actualizada' });
      form.reset();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  return (
    <>
      <PageHeader title="Seguridad" description="Cambia tu contraseña" />
      <Card withBorder padding="lg" radius="md" maw={500}>
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
              autoComplete="new-password"
              {...form.getInputProps('newPassword')}
            />
            <PasswordInput
              label="Confirmar"
              required
              autoComplete="new-password"
              {...form.getInputProps('confirm')}
            />
            <Button type="submit" loading={change.isPending}>
              Actualizar
            </Button>
          </Stack>
        </form>
      </Card>
    </>
  );
}
