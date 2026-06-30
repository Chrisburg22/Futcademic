import { Card, Stack, Text, Title, ScrollArea } from '@mantine/core';
import { PageHeader } from '../../components/common/PageHeader';

export function TermsPage() {
  return (
    <>
      <PageHeader title="Términos y condiciones" />
      <Card withBorder padding="lg" radius="md">
        <ScrollArea h={500}>
          <Stack>
            <Title order={4}>1. Aceptación</Title>
            <Text size="sm">
              Al usar Futcamedic aceptas estos términos y nuestra política de privacidad. Si no
              estás de acuerdo, no uses la plataforma.
            </Text>
            <Title order={4}>2. Uso de la plataforma</Title>
            <Text size="sm">
              Futcamedic ofrece herramientas para administrar academias deportivas: alumnos,
              profesores, asistencia, pagos y eventos. Cada academia es responsable de sus datos.
            </Text>
            <Title order={4}>3. Privacidad de datos</Title>
            <Text size="sm">
              Tus datos están aislados por academia (multi-tenant). No compartimos información
              con terceros sin consentimiento.
            </Text>
            <Title order={4}>4. Limitación de responsabilidad</Title>
            <Text size="sm">
              Futcamedic se entrega "tal cual". No nos responsabilizamos por pérdidas derivadas
              del uso de la plataforma.
            </Text>
            <Title order={4}>5. Contacto</Title>
            <Text size="sm">Para dudas, escribe a soporte@futcamedic.com.</Text>
          </Stack>
        </ScrollArea>
      </Card>
    </>
  );
}
