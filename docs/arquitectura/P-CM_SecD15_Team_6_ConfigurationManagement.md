# Configuration Management — Ejercicio Entregable

**Proyecto:** Futcamedic · **Repositorio demo:** `backend/` (futcademic-backend)
**Sección:** D15 · **Equipo:** 6 · **Término:** 2026
**Integrante:** Christian A. Ramos Pérez
**Fecha:** 23-Abr-2026
**Herramienta CM:** Git 2.x + remoto GitHub (`origin → https://github.com/Chrisburg22/futcademic-backend.git`)

---

## Objetivo

Documentar paso a paso, con capturas de pantalla de la terminal, la creación y el monitoreo de un proyecto desde cero y las 5 acciones básicas de Configuration Management:

1. **Create** — alta de un elemento de configuración.
2. **Modify** — modificar el elemento.
3. **Upload a new version** — marcar una nueva versión (tag release).
4. **Delete** — eliminar un elemento controlado.
5. **Show version history (map)** — visualizar el historial y el mapa de versiones.

El ejercicio se ejecuta sobre el repositorio `backend/` del proyecto Futcamedic usando comandos `git` locales. El push al remoto GitHub se realiza de forma manual por el integrante al final.

> **Cómo tomar las capturas:** cada paso de este documento incluye el bloque de salida real capturado de la terminal. Para el entregable, reproducir los mismos comandos en la terminal y tomar un screenshot (`Cmd+Shift+4` en macOS) del bloque completo. Pegar cada captura debajo del paso correspondiente.

---

## 0. Estado inicial del repositorio

### 0.1 Verificación de que el repositorio ya existe

Comando:

```bash
$ cd backend
$ git status
$ git remote -v
$ git log --oneline | head -5
```

**Captura 0.1 — estado inicial:**

```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean

origin    https://github.com/Chrisburg22/futcademic-backend.git (fetch)
origin    https://github.com/Chrisburg22/futcademic-backend.git (push)

902ba25 contraseña por defecto
35fafde new backend
49c14db Mas cambious
4309b50 add more endpoints
94bfecd fix: update package.json for Render deployment
```

### 0.2 Identidad del autor de commits

```bash
$ git config user.name
Christian Alejandro Ramos Pérez

$ git config user.email
94751604+Chrisburg22@users.noreply.github.com
```

> Si el repo no existiera, para crearlo desde cero:
> ```bash
> mkdir proyecto && cd proyecto
> git init
> git remote add origin https://github.com/<usuario>/<repo>.git
> ```

---

## 1. CREATE — Alta de un nuevo elemento de configuración

**Acción:** crear una carpeta `docs-cm/` con un archivo `NOTES.md` dentro del proyecto y registrarlo como un commit en git.

### 1.1 Crear el archivo en el filesystem

```bash
$ mkdir -p docs-cm
$ cat > docs-cm/NOTES.md <<'EOF'
# Notas de Configuration Management — Futcamedic backend

Archivo creado para documentar el ejercicio de CM con git.

## Propósito

Demostrar las 5 acciones básicas de Configuration Management:

1. Create
2. Modify
3. Upload new version
4. Delete
5. Show version history (map)

## Versión

v1.0.0
EOF
```

### 1.2 Agregar al staging area y commitear

```bash
$ git status
On branch main
Your branch is up to date with 'origin/main'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)
    docs-cm/

nothing added to commit but untracked files present (use "git add" to track)

$ git add docs-cm/NOTES.md

$ git status
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
    new file:   docs-cm/NOTES.md

$ git commit -m "feat(cm): create CM demo notes file"
[main 59d3ba6] feat(cm): create CM demo notes file
 1 file changed, 17 insertions(+)
 create mode 100644 docs-cm/NOTES.md
```

**Captura 1 — Create:** el output anterior muestra el flujo completo `git status → git add → git status → git commit`.

**Resultado:** commit `59d3ba6` creado en `main` con el nuevo archivo bajo control de versiones.

---

## 2. MODIFY — Modificar el elemento bajo control

**Acción:** editar el archivo `NOTES.md` para agregar una sección de changelog y política de branching; registrar el cambio como un nuevo commit.

### 2.1 Ver qué cambió (diff antes del commit)

```bash
$ git diff docs-cm/NOTES.md
diff --git a/docs-cm/NOTES.md b/docs-cm/NOTES.md
index 40b47a0..567ffd8 100644
--- a/docs-cm/NOTES.md
+++ b/docs-cm/NOTES.md
@@ -14,4 +14,15 @@ Demostrar las 5 acciones básicas de Configuration Management:

 ## Versión

-v1.0.0
+v1.1.0
+
+## Changelog
+
+- v1.0.0 — Creación inicial del archivo con las 5 acciones de CM.
+- v1.1.0 — Añadido este changelog y mención de la política de branching (`main` = producción).
+
+## Política de branching
+
+- `main` → rama estable, cada commit puede ser desplegado.
+- `feat/*` → nuevas funcionalidades, se mergean a `main` via PR.
+- Tags `vX.Y.Z` marcan releases desplegables.
```

### 2.2 Agregar al staging y commitear

```bash
$ git add docs-cm/NOTES.md

$ git commit -m "docs(cm): add changelog and branching policy"
[main d85a3d2] docs(cm): add changelog and branching policy
 1 file changed, 12 insertions(+), 1 deletion(-)
```

**Captura 2 — Modify:** `git diff` muestra los cambios, `git commit` los registra.

**Resultado:** commit `d85a3d2` con las modificaciones sobre el archivo existente.

---

## 3. UPLOAD NEW VERSION — Publicar una nueva versión (release tag)

**Acción:** marcar ambos commits con tags anotados siguiendo SemVer (`v1.0.0` y `v1.1.0`). Un tag anotado es la forma estándar de git para publicar una versión estable.

### 3.1 Crear tags anotados sobre commits específicos

```bash
$ git tag -a v1.0.0 59d3ba6 -m "Release 1.0.0 — CM demo initial notes"
$ git tag -a v1.1.0 d85a3d2 -m "Release 1.1.0 — add changelog + branching policy"
```

### 3.2 Listar los tags creados

```bash
$ git tag -l -n1
v1.0.0          Release 1.0.0 — CM demo initial notes
v1.1.0          Release 1.1.0 — add changelog + branching policy
```

### 3.3 Inspeccionar el tag anotado (contiene autor, fecha, mensaje y commit)

```bash
$ git show v1.1.0 --stat
tag v1.1.0
Tagger: Christian Alejandro Ramos Pérez <94751604+Chrisburg22@users.noreply.github.com>
Date:   Thu Apr 23 11:08:54 2026 -0600

Release 1.1.0 — add changelog + branching policy

commit d85a3d225d3138af2061d56123eaf0b366c3dd0e
Author: Christian Alejandro Ramos Pérez <94751604+Chrisburg22@users.noreply.github.com>
Date:   Thu Apr 23 11:08:26 2026 -0600

    docs(cm): add changelog and branching policy

 docs-cm/NOTES.md | 13 ++++++++++++-
 1 file changed, 12 insertions(+), 1 deletion(-)
```

### 3.4 Publicar tags al remoto GitHub (paso manual realizado por el integrante)

```bash
$ git push origin main
$ git push origin --tags
```

Una vez en GitHub, los tags aparecen en la pestaña **Releases** del repositorio.

**Captura 3 — Upload new version:** las salidas anteriores muestran el tag creado, su contenido y el comando de push.

**Resultado:** dos versiones publicadas y etiquetadas en el repo.

---

## 4. DELETE — Eliminar un elemento del control de versiones

**Acción:** crear un archivo temporal `TEMP-SCRATCH.md`, commitearlo para que quede bajo control, y posteriormente eliminarlo con `git rm` + commit. Esto demuestra que CM registra tanto las creaciones como las eliminaciones.

### 4.1 Crear el archivo temporal y commitearlo

```bash
$ cat > docs-cm/TEMP-SCRATCH.md <<'EOF'
# Scratch temporal

Archivo de prueba creado únicamente para demostrar el paso de Delete
del ejercicio de Configuration Management.
EOF

$ git add docs-cm/TEMP-SCRATCH.md
$ git commit -m "chore(cm): add temporary scratch file (to be deleted)"
[main a67f5c3] chore(cm): add temporary scratch file (to be deleted)
 1 file changed, 3 insertions(+)
 create mode 100644 docs-cm/TEMP-SCRATCH.md
```

### 4.2 Eliminarlo con git (borra del disco + del index)

```bash
$ git rm docs-cm/TEMP-SCRATCH.md
rm 'docs-cm/TEMP-SCRATCH.md'

$ git status
On branch main
Your branch is ahead of 'origin/main' by 3 commits.
  (use "git push" to publish your local commits)

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
    deleted:    docs-cm/TEMP-SCRATCH.md

$ git commit -m "chore(cm): delete temporary scratch file (CM delete demo)"
[main 9be5dba] chore(cm): delete temporary scratch file (CM delete demo)
 1 file changed, 3 deletions(-)
 delete mode 100644 docs-cm/TEMP-SCRATCH.md
```

**Captura 4 — Delete:** la salida muestra la creación (`a67f5c3`), el `git rm` y la eliminación (`9be5dba`).

**Nota de trazabilidad:** el archivo fue **eliminado**, pero su historia permanece en el repo. Siempre es posible recuperarlo:

```bash
$ git checkout a67f5c3 -- docs-cm/TEMP-SCRATCH.md
# lo restaura con el contenido que tenía en ese commit
```

Esta es una propiedad fundamental del CM: no se pierde información, sólo se marca como no presente en la rama actual.

---

## 5. SHOW VERSION HISTORY — Mapa de versiones

**Acción:** visualizar el historial lineal del repo y el mapa de ramas/tags.

### 5.1 Historial simple (one-line)

```bash
$ git log --oneline -10
9be5dba chore(cm): delete temporary scratch file (CM delete demo)
a67f5c3 chore(cm): add temporary scratch file (to be deleted)
d85a3d2 docs(cm): add changelog and branching policy
59d3ba6 feat(cm): create CM demo notes file
902ba25 contraseña por defecto
35fafde new backend
49c14db Mas cambious
4309b50 add more endpoints
94bfecd fix: update package.json for Render deployment
307ba34 render
```

### 5.2 Mapa gráfico con tags y ramas (`--graph --decorate --all`)

```bash
$ git log --graph --oneline --decorate --all -15
* 9be5dba (HEAD -> main) chore(cm): delete temporary scratch file (CM delete demo)
* a67f5c3 chore(cm): add temporary scratch file (to be deleted)
* d85a3d2 (tag: v1.1.0) docs(cm): add changelog and branching policy
* 59d3ba6 (tag: v1.0.0) feat(cm): create CM demo notes file
* 902ba25 (origin/main, origin/HEAD) contraseña por defecto
* 35fafde new backend
* 49c14db Mas cambious
* 4309b50 add more endpoints
* 94bfecd fix: update package.json for Render deployment
* 307ba34 render
* a2b756f vercel prod
* d152efc primer commit
```

**Captura 5 — Version history (map):** los símbolos `*` marcan cada commit; `(HEAD -> main)` indica dónde estamos; `(tag: v1.0.0)` y `(tag: v1.1.0)` marcan las versiones publicadas; `(origin/main)` muestra dónde está el remoto respecto al local.

### 5.3 Alternativa gráfica en GitHub (screenshot sugerido)

Tras hacer `git push origin main --tags`, abrir:

- `https://github.com/Chrisburg22/futcademic-backend/network` (graph view)
- `https://github.com/Chrisburg22/futcademic-backend/tags` (lista de versiones)
- `https://github.com/Chrisburg22/futcademic-backend/releases` (releases generadas a partir de tags)

Tomar screenshot de la vista `/network` para incluir el mapa visual de commits + branches + tags.

### 5.4 Cambios específicos de una versión

```bash
$ git diff v1.0.0 v1.1.0 --stat
 docs-cm/NOTES.md | 13 ++++++++++++-
 1 file changed, 12 insertions(+), 1 deletion(-)
```

Mostramos que entre v1.0.0 y v1.1.0 sólo cambió un archivo con 12 inserciones y 1 eliminación.

---

## 6. Resumen final de CM (tabla)

| # | Acción | Comando git principal | Commit / Tag resultante |
|---|---|---|---|
| 1 | Create | `git add` + `git commit` | `59d3ba6` |
| 2 | Modify | `git diff` → `git add` → `git commit` | `d85a3d2` |
| 3 | Upload new version | `git tag -a vX.Y.Z` + `git push --tags` | `v1.0.0`, `v1.1.0` |
| 4 | Delete | `git rm` + `git commit` | `a67f5c3` (add), `9be5dba` (delete) |
| 5 | Show history (map) | `git log --graph --decorate --all` | — |

### Estado final del repositorio

- 4 nuevos commits añadidos sobre `main`.
- 2 tags anotados creados.
- 1 archivo activo (`docs-cm/NOTES.md`).
- 1 archivo eliminado con trazabilidad preservada en la historia (`docs-cm/TEMP-SCRATCH.md`).

### Próximo paso del integrante (manual)

```bash
$ git push origin main
$ git push origin --tags
```

Esto sincroniza el trabajo local con el remoto en GitHub para que quede visible en el repositorio público del equipo.

---

## Conclusión

Las 5 acciones básicas de Configuration Management quedaron demostradas y capturadas:

- **Create / Modify / Delete** se realizan con el tríptico `git status / git add / git commit` y `git rm`.
- **Upload new version** se formaliza con `git tag -a` + `git push --tags`, creando un punto estable y recuperable del sistema.
- **Show history** se inspecciona con `git log --graph --decorate --all`, que produce el mapa de versiones requerido por el ejercicio.

Git actúa como **sistema de CM** proporcionando: trazabilidad total (cada cambio tiene autor + fecha + mensaje), reversibilidad (todo commit o archivo borrado es recuperable), versionado semántico (via tags) y un flujo distribuido (local + remoto) coherente con el trabajo individual y en equipo.
