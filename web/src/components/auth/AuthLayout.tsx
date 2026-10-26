import type { ReactNode } from 'react';
import { Box, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconCalendarCheck,
  IconCreditCard,
  IconUsersGroup,
  type IconProps,
} from '@tabler/icons-react';
import { BrandLogo } from '../common/BrandLogo';
import classes from './AuthLayout.module.css';

const HIGHLIGHTS: { icon: (props: IconProps) => ReactNode; title: string; text: string }[] = [
  {
    icon: IconCalendarCheck,
    title: 'Asistencia al día',
    text: 'Pasa lista en segundos y consulta el historial por categoría.',
  },
  {
    icon: IconCreditCard,
    title: 'Pagos sin planillas',
    text: 'Mensualidades, adeudos y recibos de toda la academia en un sitio.',
  },
  {
    icon: IconUsersGroup,
    title: 'Padres informados',
    text: 'Cada familia ve los entrenamientos, partidos y logros de su hijo.',
  },
];

/**
 * Marco común de las pantallas de autenticación: panel de marca a la
 * izquierda en escritorio y la tarjeta del formulario centrada.
 *
 * Todas las vistas de /login, /register y recuperación lo usan para que la
 * entrada a la app se sienta la misma pantalla y no seis distintas.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className={classes.root}>
      <aside className={classes.aside}>
        <Group gap="sm" className={classes.asideContent}>
          <BrandLogo size={36} variant="inverted" />
          <Text fw={700} fz="lg">
            Futcademic
          </Text>
        </Group>

        <div className={classes.asideContent}>
          <Title order={2} fz={34} lh={1.2} mb="xl">
            La academia, ordenada en un solo lugar.
          </Title>
          <Stack gap="lg">
            {HIGHLIGHTS.map((item) => (
              <Group key={item.title} gap="md" wrap="nowrap" align="flex-start">
                <ThemeIcon variant="transparent" c="white" size="lg">
                  <item.icon size={24} stroke={1.6} />
                </ThemeIcon>
                <div>
                  <Text fw={600}>{item.title}</Text>
                  <Text fz="sm" opacity={0.75}>
                    {item.text}
                  </Text>
                </div>
              </Group>
            ))}
          </Stack>
        </div>

        <Text fz="xs" opacity={0.6} className={classes.asideContent}>
          Gestión de academias de fútbol
        </Text>
      </aside>

      <main className={classes.main}>
        <Box className={classes.card}>
          <Stack gap={4} align="center" mb="xl" hiddenFrom="md">
            <BrandLogo size={48} />
          </Stack>

          <Stack gap={6} mb="lg">
            <Title order={1} fz={26}>
              {title}
            </Title>
            {subtitle && (
              <Text c="dimmed" fz="sm">
                {subtitle}
              </Text>
            )}
          </Stack>

          <Paper withBorder shadow="sm" radius="lg" p="xl">
            {children}
          </Paper>

          {footer && <Box mt="lg">{footer}</Box>}
        </Box>
      </main>
    </div>
  );
}
