import type { APIRoute } from 'astro';

/**
 * robots.txt generado, no estático: el Sitemap tiene que apuntar al dominio
 * real del despliegue (`PUBLIC_SITE_URL`), no a uno escrito a mano.
 */
export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://futcademic.com')).href.replace(/\/$/, '');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
