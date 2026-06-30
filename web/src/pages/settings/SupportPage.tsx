import { Card, Stack, TextInput, Textarea, Button, Anchor, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { PageHeader } from '../../components/common/PageHeader';

export function SupportPage() {
  const form = useForm({
    initialValues: { subject: '', message: '' },
    validate: {
      subject: (v) => (v.length >= 3 ? null : 'Requerido'),
      message: (v) => (v.length >= 10 ? null : 'Mínimo 10 caracteres'),
    },
  });

  const onSubmit = (v: typeof form.values) => {
    const mailto = `mailto:soporte@futcamedic.com?subject=${encodeURIComponent(
      v.subject,
    )}&body=${encodeURIComponent(v.message)}`;
    window.location.href = mailto;
    notifications.show({ color: 'green', message: 'Abriendo cliente de correo...' });
  };

  return (
    <>
      <PageHeader title="Soporte" description="Contáctanos si necesitas ayuda" />
      <Card withBorder padding="lg" radius="md" maw={600}>
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack>
            <TextInput label="Asunto" required {...form.getInputProps('subject')} />
            <Textarea
              label="Mensaje"
              required
              autosize
              minRows={5}
              {...form.getInputProps('message')}
            />
            <Button type="submit">Enviar</Button>
            <Text size="sm" c="dimmed">
              También puedes escribirnos directamente a{' '}
              <Anchor href="mailto:soporte@futcamedic.com">soporte@futcamedic.com</Anchor>
            </Text>
          </Stack>
        </form>
      </Card>
    </>
  );
}
