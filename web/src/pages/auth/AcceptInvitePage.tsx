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
  Avatar,
  Group,
  Badge,
  Loader,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { supabase } from '../../config/supabase';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super administrador',
  admin: 'Administrador',
  profesor: 'Profesor',
  padre: 'Padre de familia',
  alumno: 'Alumno',
};

type InvitedProfile = {
  full_name: string | null;
  role: string;
  school?: { name: string } | null;
  email?: string;
};

export function AcceptInvitePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid'>('loading');
  const [invited, setInvited] = useState<InvitedProfile | null>(null);
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

      // Flujo principal: el link apunta a nuestro sitio con ?token_hash=...&type=...
      // y verificamos el token aquí (el dominio de Supabase no se expone).
      const tokenHash = query.get('token_hash');
      const type = query.get('type') as 'invite' | 'magiclink' | null;
      if (tokenHash && type) {
        const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (otpError) {
          setError('El enlace de invitación no es válido o ya expiró.');
          setStatus('invalid');
          return;
        }
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        // Fallback: link legacy con tokens en el hash (#access_token=...)
        const access_token = hash.get('access_token');
        const refresh_token = hash.get('refresh_token');
        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
          if (sessionError) {
            setError('El enlace de invitación no es válido o ya expiró.');
            setStatus('invalid');
            return;
          }
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('El enlace de invitación no es válido o ya expiró.');
        setStatus('invalid');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('full_name, role, school:schools ( name )')
        .eq('id', session.user.id)
        .single();

      setInvited({
        full_name: profile?.full_name || session.user.user_metadata?.full_name || null,
        role: (profile?.role as string) || session.user.user_metadata?.invited_role || '',
        school: (profile?.school as any) || null,
        email: session.user.email,
      });
      setStatus('ready');
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
      navigate('/', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Error al establecer la contraseña');
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
              {error || 'El enlace de invitación no es válido o ya expiró.'}
            </Alert>
            <Text size="sm" c="dimmed" ta="center">
              Pide a tu academia que te envíe una nueva invitación.
            </Text>
            <Button variant="light" onClick={() => navigate('/login')}>
              Ir a iniciar sesión
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={460} my={80}>
      <Stack gap="xs" align="center" mb="lg">
        <Title order={3}>¡Bienvenido!</Title>
        <Text c="dimmed" size="sm" ta="center">
          Fuiste invitado a {invited?.school?.name || 'una academia'}. Crea tu
          contraseña para activar tu cuenta.
        </Text>
      </Stack>
      <Paper withBorder shadow="sm" p="xl" radius="md">
        <Stack>
          <Group>
            <Avatar radius="xl" size="lg">
              {invited?.full_name?.[0]?.toUpperCase()}
            </Avatar>
            <div>
              <Text fw={500}>{invited?.full_name}</Text>
              <Text size="xs" c="dimmed">
                {invited?.email}
              </Text>
              {invited?.role && (
                <Badge size="sm" variant="light" mt={4}>
                  {ROLE_LABELS[invited.role] || invited.role}
                </Badge>
              )}
            </div>
          </Group>
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
                Crear cuenta
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
