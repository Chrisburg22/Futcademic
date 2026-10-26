'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/** Dónde tiene que aterrizar cada tipo de enlace de Supabase. */
const DESTINATION: Record<string, string> = {
  recovery: '/reset-password',
  invite: '/accept-invite',
  magiclink: '/accept-invite',
  signup: '/accept-invite',
};

/**
 * Rescata los enlaces de correo que no caen en su pantalla.
 *
 * Supabase ignora el `redirectTo` cuando no está en la lista de Redirect URLs
 * del proyecto y manda al Site URL a secas, normalmente la raíz. Sin esto el
 * usuario llega con sesión abierta al dashboard y nunca ve el formulario de
 * contraseña nueva, que es justo lo que venía a hacer.
 *
 * El tipo viaja en la query (`?type=recovery`) o en el hash
 * (`#access_token=...&type=recovery`), según la plantilla del correo.
 *
 * En App Router la navegación no puede ocurrir durante el render y el hash no
 * lo expone `useSearchParams`, así que la decisión se toma en un efecto leyendo
 * la URL del navegador. Mientras tanto se pinta el contenido normal: el
 * redirect ocurre antes de que el usuario llegue a interactuar.
 */
export function AuthLinkRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    const type = query.get('type') || hash.get('type');
    const hasToken =
      query.has('token_hash') || hash.has('access_token') || query.has('error_description');

    const destination = type ? DESTINATION[type] : undefined;
    if (!destination || !hasToken || pathname === destination) return;

    setRedirecting(true);
    const search = window.location.search;
    router.replace(`${destination}${search}${window.location.hash}`);
  }, [pathname, router]);

  if (redirecting) return null;

  return <>{children}</>;
}
