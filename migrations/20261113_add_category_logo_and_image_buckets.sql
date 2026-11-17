-- ---------------------------------------------------------------------------
-- Fotos: escudo de categoría + buckets públicos de imágenes
--
-- Los buckets `avatars` y `logos` ya se usaban desde el backend pero estaban
-- creados a mano en el proyecto Supabase: esta migración los versiona para que
-- un entorno nuevo quede igual. `categories.logo_url` es nuevo.
-- ---------------------------------------------------------------------------

-- 1. Escudo de categoría / equipo
alter table public.categories add column if not exists logo_url text;

-- 2. Buckets públicos de imágenes
--    Públicos a propósito: las fotos se pintan en listados y avatares, y una
--    URL firmada por fila rompería el caché del CDN.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
