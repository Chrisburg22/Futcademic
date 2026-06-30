-- Añade username único por escuela para que alumnos puedan loguearse sin correo real.
-- El campo es opcional para los demás roles (admin/profesor/padre usan email).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username TEXT;

-- UNIQUE compuesto (school_id, username) — diferentes escuelas pueden reusar el mismo username.
CREATE UNIQUE INDEX IF NOT EXISTS users_school_username_unique
  ON users (school_id, username)
  WHERE username IS NOT NULL;

-- Índice para búsqueda rápida en login.
CREATE INDEX IF NOT EXISTS users_username_idx ON users (username) WHERE username IS NOT NULL;
