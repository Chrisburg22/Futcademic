import { Skeleton, Stack } from '@mantine/core';

export type SkeletonPageProps = {
  /** Cuántas filas de contenido simular. */
  rows?: number;
  /** Alto de la primera tarjeta, la que suele llevar el resumen. */
  heroHeight?: number;
};

/**
 * Carga que **conserva la cabecera**.
 *
 * `LoadingState` es un spinner centrado que sustituye la pantalla entera, título
 * incluido: en teléfono eso se ve como si la app se hubiera vaciado. Esto se
 * monta debajo del `PageHeader` y mantiene la forma de lo que va a llegar.
 */
export function SkeletonPage({ rows = 3, heroHeight = 140 }: SkeletonPageProps) {
  return (
    <Stack gap="md" aria-busy="true" aria-live="polite">
      <Skeleton height={heroHeight} radius="md" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={72} radius="md" />
      ))}
    </Stack>
  );
}
