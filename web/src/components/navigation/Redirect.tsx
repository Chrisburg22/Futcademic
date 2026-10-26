'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Equivalente a `<Navigate replace>` de React Router.
 * En App Router la navegación no puede ocurrir durante el render, así que se
 * hace en un efecto. Mientras tanto no se pinta nada.
 */
export function Redirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return null;
}
