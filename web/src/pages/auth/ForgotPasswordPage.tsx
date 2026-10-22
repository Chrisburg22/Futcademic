import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextInput,
  Button,
  Title,
  Text,
  Stack,
  Anchor,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconMailCheck } from '@tabler/icons-react';
import { supabase } from '../../config/supabase';

export function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm({
    initialValues: { email: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Correo inválido'),
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
    setSent(true);
  };

  return (
    <Container size={420} my={80}>
      <Stack gap="xs" align="center" mb="lg">
        <Title order={3}>¿Olvidaste tu contraseña?</Title>
        <Text c="dimmed" size="sm" ta="center">
          Escribe tu correo y te enviamos un enlace para crear una nueva.
        </Text>
      </Stack>
      <Paper withBorder shadow="sm" p="xl" radius="md">
        {sent ? (
          <Stack>
            <Alert color="green" icon={<IconMailCheck size={16} />}>
              Si <b>{form.values.email}</b> tiene una cuenta, le enviamos un
              enlace para restablecer la contraseña. Revisa también el spam.
            </Alert>
            <Text size="sm" ta="center">
              <Anchor component={Link} to="/login">
                Volver a iniciar sesión
              </Anchor>
            </Text>
          </Stack>
        ) : (
          <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />}>
                  {error}
                </Alert>
              )}
              <TextInput
                label="Correo"
                placeholder="tu@correo.com"
                autoComplete="email"
                required
                {...form.getInputProps('email')}
              />
              <Button type="submit" loading={submitting} fullWidth>
                Enviar enlace
              </Button>
              <Text size="sm" ta="center">
                <Anchor component={Link} to="/login">
                  Volver a iniciar sesión
                </Anchor>
              </Text>
            </Stack>
          </form>
        )}
      </Paper>
    </Container>
  );
}
