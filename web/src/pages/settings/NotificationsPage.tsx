import { Card, Stack, Switch, Text } from '@mantine/core';
import { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';

export function NotificationsPage() {
  const [emailPayments, setEmailPayments] = useState(true);
  const [emailEvents, setEmailEvents] = useState(true);
  const [emailAttendance, setEmailAttendance] = useState(false);

  return (
    <>
      <PageHeader title="Notificaciones" description="Configura tus preferencias" />
      <Card withBorder padding="lg" radius="md" maw={600}>
        <Stack>
          <Switch
            label="Recordatorios de pagos"
            checked={emailPayments}
            onChange={(e) => setEmailPayments(e.currentTarget.checked)}
          />
          <Switch
            label="Próximos eventos y entrenamientos"
            checked={emailEvents}
            onChange={(e) => setEmailEvents(e.currentTarget.checked)}
          />
          <Switch
            label="Resumen semanal de asistencia"
            checked={emailAttendance}
            onChange={(e) => setEmailAttendance(e.currentTarget.checked)}
          />
          <Text size="xs" c="dimmed">
            Las notificaciones por correo se procesan desde el backend.
          </Text>
        </Stack>
      </Card>
    </>
  );
}
