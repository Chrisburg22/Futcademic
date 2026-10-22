import { useEffect, useState } from 'react';
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
  Loader,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { supabase } from '../../config/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    initialValues: { password: '', confirm: '' },
    validate: {
      password: (v) => (v.length >= 8 ? null : 'Mínimo 8 caracteres'),
      confirm: (v, vals) => (v === vals.password ? null : 'No coinciden'),
    },
  });

  useEffect(() => {
    const init = async () => {
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));

      const errorDescription = query.get('error_description') || hash.get('error_description');
      if (errorDescription) {
        setError(errorDescription.replace(/\+/g, ' '));
        setStatus('invalid');
        return;
      }

      // Flujo principal: el correo apunta a nuestro sitio con
      // ?token_hash=...&type=recovery y canjeamos el token aquí.
      const tokenHash = query.get('token_hash');
      if (tokenHash) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        if (otpError) {
          setError('El enlace de recuperación no es válido o ya expiró.');
          setStatus('invalid');
          return;
        }
        window.history.replaceState(null, '', window.location.pathname);
        setStatus('ready');
        return;
      }

      // Fallback: link con tokens en el hash (#access_token=...&type=recovery)
      const access_token = hash.get('access_token');
      const refresh_token = hash.get('refresh_token');
      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) {
          setError('El enlace de recuperación no es válido o ya expiró.');
          setStatus('invalid');
          return;
        }
        window.history.replaceState(null, '', window.location.pathname);
        setStatus('ready');
        return;
      }

      // Sin token en la URL solo dejamos continuar si ya hay sesión abierta
      // (por ejemplo tras recargar la página después de canjear el enlace).
      const { data: { session } } = await supabase.auth.getSession();
      setStatus(session?.user ? 'ready' : 'invalid');
    };

    init();
  }, []);

  const onSubmit = async (values: typeof form.values) => {
    setError(null);
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (updateError) throw updateError;
      notifications.show({ color: 'green', message: 'Contraseña actualizada' });
      navigate('/', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (status === 'invalid') {
    return (
      <Container size={420} my={80}>
        <Paper withBorder shadow="sm" p="xl" radius="md">
          <Stack align="center">
            <Alert color="red" icon={<IconAlertCircle size={16} />} w="100%">
              {error || 'El enlace de recuperación no es válido o ya expiró.'}
            </Alert>
            <Text size="sm" c="dimmed" ta="center">
              Pide un enlace nuevo para restablecer tu contraseña.
            </Text>
            <Button variant="light" onClick={() => navigate('/forgot-password')}>
              Pedir otro enlace
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={420} my={80}>
      <Stack gap="xs" align="center" mb="lg">
        <Title order={3}>Nueva contraseña</Title>
        <Text c="dimmed" size="sm" ta="center">
          Elige una contraseña para volver a entrar a tu cuenta.
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
              label="Contraseña"
              required
              autoComplete="new-password"
              {...form.getInputProps('password')}
            />
            <PasswordInput
              label="Confirmar contraseña"
              required
              autoComplete="new-password"
              {...form.getInputProps('confirm')}
            />
            <Button type="submit" loading={saving} fullWidth>
              Guardar contraseña
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
