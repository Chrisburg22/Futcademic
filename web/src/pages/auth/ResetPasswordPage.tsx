import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PasswordInput,
  Button,
  Text,
  Stack,
  Alert,
  Loader,
  Center,
  Progress,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { supabase } from '../../config/supabase';
import { AuthLayout } from '../../components/auth/AuthLayout';

const MIN_LENGTH = 8;

/** Pista visual, no una política: solo orienta mientras se escribe. */
function strengthOf(value: string) {
  const checks = [
    value.length >= MIN_LENGTH,
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ];
  return checks.filter(Boolean).length;
}

const STRENGTH_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];
const STRENGTH_COLORS = ['red', 'red', 'orange', 'yellow', 'green'];

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    initialValues: { password: '', confirm: '' },
    validateInputOnBlur: true,
    validate: {
      password: (v) => (v.length >= MIN_LENGTH ? null : `Mínimo ${MIN_LENGTH} caracteres`),
      confirm: (v, vals) => (v === vals.password ? null : 'No coinciden'),
    },
  });

  const strength = strengthOf(form.values.password);

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
      <Center h="100dvh">
        <Loader />
      </Center>
    );
  }

  if (status === 'invalid') {
    return (
      <AuthLayout title="Enlace no válido">
        <Stack gap="md">
          <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
            {error || 'El enlace de recuperación no es válido o ya expiró.'}
          </Alert>
          <Text fz="sm" c="dimmed">
            Los enlaces caducan en una hora y solo sirven una vez. Pide uno nuevo
            para continuar.
          </Text>
          <Button size="md" fullWidth onClick={() => navigate('/forgot-password')}>
            Pedir otro enlace
          </Button>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Elige una contraseña para volver a entrar a tu cuenta."
    >
      <form onSubmit={form.onSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
              {error}
            </Alert>
          )}
          <div>
            <PasswordInput
              label="Contraseña"
              description={`Al menos ${MIN_LENGTH} caracteres.`}
              autoComplete="new-password"
              autoFocus
              size="md"
              required
              withAsterisk={false}
              {...form.getInputProps('password')}
            />
            {form.values.password && (
              <>
                <Progress
                  value={(strength / 4) * 100}
                  color={STRENGTH_COLORS[strength]}
                  size="xs"
                  mt="xs"
                  aria-hidden
                />
                <Text fz="xs" c="dimmed" mt={4}>
                  Seguridad: {STRENGTH_LABELS[strength]}
                </Text>
              </>
            )}
          </div>
          <PasswordInput
            label="Confirmar contraseña"
            autoComplete="new-password"
            size="md"
            required
            withAsterisk={false}
            {...form.getInputProps('confirm')}
          />
          <Button type="submit" loading={saving} size="md" fullWidth mt="xs">
            Guardar contraseña
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
