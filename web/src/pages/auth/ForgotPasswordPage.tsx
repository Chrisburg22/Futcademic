import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TextInput,
  Button,
  Text,
  Stack,
  Group,
  Anchor,
  Alert,
  ThemeIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconArrowLeft, IconMailCheck } from '@tabler/icons-react';
import { supabase } from '../../config/supabase';
import { AuthLayout } from '../../components/auth/AuthLayout';

export function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm({
    initialValues: { email: '' },
    validateInputOnBlur: true,
    validate: {
      email: (v) =>
        !v.trim() ? 'Escribe tu correo' : /^\S+@\S+$/.test(v) ? null : 'Correo inválido',
    },
  });

  const onSubmit = async (values: typeof form.values) => {
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    // No distinguimos "correo no registrado": decirlo permitiría descubrir
    // qué correos tienen cuenta. Solo reportamos fallos reales de envío.
    if (error) {
      setError(error.message);
      return;
    }
    setSentTo(values.email);
  };

  const backLink = (
    <Group justify="center">
      <Anchor component={Link} to="/login" fz="sm">
        <Group gap={6} wrap="nowrap">
          <IconArrowLeft size={16} />
          Volver a iniciar sesión
        </Group>
      </Anchor>
    </Group>
  );

  if (sentTo) {
    return (
      <AuthLayout title="Revisa tu correo" footer={backLink}>
        <Stack gap="md" align="center" ta="center">
          <ThemeIcon size={56} radius="xl" variant="light" color="green">
            <IconMailCheck size={30} stroke={1.6} />
          </ThemeIcon>
          <Text>
            Si <b>{sentTo}</b> tiene una cuenta, le enviamos un enlace para crear
            una contraseña nueva.
          </Text>
          <Text fz="sm" c="dimmed">
            El enlace caduca en una hora. Si no aparece, mira en spam o correo no
            deseado.
          </Text>
          <Button variant="light" onClick={() => setSentTo(null)}>
            Usar otro correo
          </Button>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="¿Olvidaste tu contraseña?"
      subtitle="Escribe tu correo y te enviamos un enlace para crear una nueva."
      footer={backLink}
    >
      <form onSubmit={form.onSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
              {error}
            </Alert>
          )}
          <TextInput
            label="Correo"
            placeholder="tu@correo.com"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            size="md"
            required
            withAsterisk={false}
            {...form.getInputProps('email')}
          />
          <Button type="submit" loading={submitting} size="md" fullWidth mt="xs">
            Enviar enlace
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
