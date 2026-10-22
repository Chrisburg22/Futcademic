import { Navigate, useLocation } from 'react-router-dom';

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
 */
export function AuthLinkRedirect({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const type = query.get('type') || hash.get('type');
  const hasToken =
    query.has('token_hash') || hash.has('access_token') || query.has('error_description');

  const destination = type ? DESTINATION[type] : undefined;

  if (destination && hasToken && location.pathname !== destination) {
    return (
      <Navigate
        to={{ pathname: destination, search: location.search, hash: location.hash }}
        replace
      />
    );
  }

  return <>{children}</>;
}
