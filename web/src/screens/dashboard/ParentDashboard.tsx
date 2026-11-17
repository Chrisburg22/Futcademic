'use client';

import Link from 'next/link';
import { Alert, Avatar, Badge, Button, Stack, Title } from '@mantine/core';
import { IconAlertCircle, IconCalendarCheck } from '@tabler/icons-react';
import { useGetMyChildren } from '../../hooks/useStudents';
import { useGetPadreDashboard } from '../../hooks/useDashboard';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { SkeletonPage } from '../../components/common/SkeletonPage';
import { TouchRow } from '../../components/common/TouchRow';
import { ESTADOS_ALUMNO, normalizarEstado } from '../../lib/students';

/**
 * Inicio del padre.
 *
 * Lo que había antes: una tarjeta por hijo cuya **única** navegación eran dos
 * `Badge` de unos 20 px de alto. Eran los dos accesos más importantes de la app
 * para una familia y había que acertarles con la punta del dedo.
 *
 * Ahora la fila entera abre los pagos del hijo (donde vive el aviso) y la
 * asistencia es un botón aparte, los dos por encima de 44 px.
 */
export function ParentDashboard() {
  const {
    data: children = [],
    isLoading,
    isError,
    refetch,
  } = useGetMyChildren();
  const { data: dash } = useGetPadreDashboard();

  if (isLoading) return <SkeletonPage rows={2} heroHeight={80} />;

  if (isError) {
    return (
      <ErrorState
        title="No pudimos cargar a tus hijos"
        description="Revisa tu conexión e inténtalo de nuevo."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      {dash?.paymentAlert && (
        <Alert icon={<IconAlertCircle size={18} />} color="orange" mb="md">
          {dash.paymentAlert}
        </Alert>
      )}

      <Title order={3} fz={{ base: 'h4', sm: 'h3' }} mb="md">
        Mis hijos
      </Title>

      {children.length === 0 ? (
        <EmptyState
          title="Sin alumnos vinculados"
          description="Vincula a tu hijo con el código que te dio la academia."
          action={
            <Button component={Link} href="/children">
              Vincular hijo
            </Button>
          }
        />
      ) : (
        <Stack gap="xs">
          {(children as any[]).map((c) => (
            <TouchRow
              key={c.id}
              href={`/finances?student_id=${c.id}`}
              openLabel={`Pagos de ${c.full_name}`}
              leading={
                <Avatar src={c.avatar_url || undefined} radius="xl" size={48}>
                  {c.full_name?.[0]?.toUpperCase()}
                </Avatar>
              }
              title={c.full_name}
              subtitle={c.category?.name || 'Sin categoría'}
              tags={(() => {
                // `tt="capitalize"` sobre el valor crudo pintaba
                // «Pendiente_pago». El mapa de `lib/students` ya tiene la
                // etiqueta y el color de cada estado.
                const estado = ESTADOS_ALUMNO[normalizarEstado(c.status)];
                return (
                  <Badge variant="light" color={estado.color} size="lg">
                    {estado.label}
                  </Badge>
                );
              })()}
              trailing={
                <Button
                  component={Link}
                  href={`/attendance?student_id=${c.id}`}
                  variant="light"
                  aria-label={`Asistencias de ${c.full_name}`}
                  leftSection={<IconCalendarCheck size={18} />}
                >
                  Asistencias
                </Button>
              }
            />
          ))}
        </Stack>
      )}
    </>
  );
}
