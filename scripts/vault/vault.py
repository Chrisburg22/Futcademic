#!/usr/bin/env python3
"""Genera y verifica la boveda Obsidian de Futcademic.

La boveda vive en ``vault/``. Las notas escritas a mano explican arquitectura,
dominio y recetas; las notas generadas se construyen desde el codigo para que no
envejezcan en silencio.

Uso::

    python3 scripts/vault/vault.py generar
    python3 scripts/vault/vault.py verificar
    python3 scripts/vault/vault.py brief

Solo usa la biblioteca estandar de Python 3.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from datetime import date, datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
BOVEDA = RAIZ / "vault"
BACKEND = RAIZ / "backend"
WEB = RAIZ / "web"
HOY = date.today().isoformat()

NOTA_API = BOVEDA / "02-Backend" / "API - rutas.md"
NOTA_TABLAS = BOVEDA / "04-Datos" / "Tablas.md"
NOTA_RUTAS_WEB = BOVEDA / "03-Web" / "Rutas web.md"
NOTA_HOOKS = BOVEDA / "03-Web" / "Hooks y endpoints.md"
NOTA_INDICE = BOVEDA / "00-Inicio" / "Indice completo.md"

ORDEN_RECURSOS = [
    "auth", "users", "students", "attendances", "categories", "payments",
    "events", "schools", "venues", "permissions", "dashboard", "export",
    "notifications", "achievements", "upload", "parents", "chat", "health",
]

ARCHIVO_RUTA = {
    "auth": "auth.routes.ts",
    "users": "user.routes.ts",
    "students": "student.routes.ts",
    "attendances": "attendance.routes.ts",
    "categories": "category.routes.ts",
    "payments": "payment.routes.ts",
    "events": "event.routes.ts",
    "schools": "school.routes.ts",
    "venues": "venue.routes.ts",
    "permissions": "permission.routes.ts",
    "dashboard": "dashboard.routes.ts",
    "export": "export.routes.ts",
    "notifications": "notification.routes.ts",
    "achievements": "achievement.routes.ts",
    "upload": "upload.routes.ts",
    "parents": "parent.routes.ts",
    "chat": "chat.routes.ts",
    "health": "app.ts",
}

# Llamadas que arman la URL en una variable; el regex no las puede leer.
URLS_DINAMICAS = [
    ("useEvents.ts", "`GET /events`, `GET /events/trainings`"),
    ("useAttendances.ts", "`GET /attendances/category/:id`"),
    ("usePayments.ts", "`GET /payments`"),
    ("useDashboard.ts", "`GET /dashboard/admin|profesor|padre|alumno`"),
    ("useStudents.ts", "`GET /students`"),
]


# --------------------------------------------------------------------------
# Utilidades
# --------------------------------------------------------------------------

def normalizar(valor: str) -> str:
    return unicodedata.normalize("NFC", valor).casefold().strip()


def leer(ruta: Path) -> str:
    return ruta.read_text(encoding="utf-8")


def separar_frontmatter(texto: str) -> tuple[str, str]:
    if texto.startswith("---\n"):
        partes = texto.split("\n---\n", 1)
        if len(partes) == 2:
            return partes[0][4:], partes[1]
    return "", texto


def parsear_frontmatter(texto: str) -> dict:
    datos: dict = {}
    cabecera, _ = separar_frontmatter(texto)
    clave = None
    for linea in cabecera.splitlines():
        if not linea.strip():
            continue
        if re.match(r"^\s+-\s+", linea) or re.match(r"^\s*-\s+", linea):
            if clave is not None:
                if not isinstance(datos.get(clave), list):
                    datos[clave] = []
                datos[clave].append(linea.split("-", 1)[1].strip().strip('"').strip("'"))
            continue
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", linea)
        if m:
            clave = m.group(1)
            valor = m.group(2).strip()
            if valor.startswith("[") and valor.endswith("]"):
                datos[clave] = [
                    v.strip().strip('"').strip("'")
                    for v in valor[1:-1].split(",")
                    if v.strip()
                ]
            else:
                datos[clave] = valor if valor else []
    return datos


def escribir_generada(ruta: Path, cuerpo: str, tags: list[str]) -> None:
    cuerpo = cuerpo.strip() + "\n"
    huella = hashlib.sha256(cuerpo.encode("utf-8")).hexdigest()[:12]
    ruta.parent.mkdir(parents=True, exist_ok=True)
    etiquetas = "\n".join(f"  - {t}" for t in tags)
    texto = (
        "---\n"
        "tipo: generado\n"
        "generado_por: scripts/vault/vault.py\n"
        f"hash: {huella}\n"
        f"actualizado: {HOY}\n"
        "tags:\n"
        f"{etiquetas}\n"
        "---\n\n"
        "<!-- No editar a mano: python3 scripts/vault/vault.py generar -->\n\n"
        f"{cuerpo}"
    )
    ruta.write_text(texto, encoding="utf-8")


def tabla(cabeceras: list[str], filas: list[list[str]]) -> str:
    lineas = [
        "| " + " | ".join(cabeceras) + " |",
        "| " + " | ".join("---" for _ in cabeceras) + " |",
    ]
    for fila in filas:
        lineas.append("| " + " | ".join(celda.replace("|", "\\|") for celda in fila) + " |")
    return "\n".join(lineas)


# --------------------------------------------------------------------------
# API
# --------------------------------------------------------------------------

def _acceso(ruta: dict) -> str:
    if not ruta.get("auth"):
        return "público"
    roles = ruta.get("roles") or []
    if not roles:
        return "autenticado"
    return ", ".join(roles)


def render_api() -> str:
    archivo = BACKEND / "api-contract.json"
    if not archivo.exists():
        return (
            "# API - rutas\n\n"
            "> [!warning] No se encontró `backend/api-contract.json`.\n"
            "> Genera el contrato con `cd backend && npm run routes:dump` y vuelve a "
            "correr `python3 scripts/vault/vault.py generar`."
        )

    datos = json.loads(leer(archivo))
    rutas = datos.get("routes", [])
    grupos: dict[str, list[dict]] = {}
    for ruta in rutas:
        segmentos = ruta["path"].split("/")
        recurso = segmentos[2] if len(segmentos) > 2 else "raiz"
        grupos.setdefault(recurso, []).append(ruta)

    orden = [r for r in ORDEN_RECURSOS if r in grupos]
    orden += sorted(r for r in grupos if r not in orden)

    publicas = sum(1 for r in rutas if not r.get("auth"))
    lineas = [
        "# API - rutas",
        "",
        "Contrato real del backend, leído de `backend/api-contract.json`.",
        "",
        f"- **{len(rutas)} endpoints** en **{len(grupos)} grupos**.",
        f"- **{publicas} públicos** (sin token); el resto exige `Authorization: Bearer`.",
        "- La columna **Acceso** sale de `requireRole(...)`; `autenticado` significa "
        "que la ruta no declara roles.",
        "",
        "> [!info] Cómo regenerar",
        "> `cd backend && npm run routes:dump` y después "
        "`python3 scripts/vault/vault.py generar`.",
        "",
        "## Grupos",
        "",
    ]
    for grupo in orden:
        lineas.append(f"- [[#{grupo}]] ({len(grupos[grupo])})")
    lineas.append("")

    for grupo in orden:
        archivo_ruta = ARCHIVO_RUTA.get(grupo)
        fuente = f"`backend/api/routes/{archivo_ruta}`" if archivo_ruta and archivo_ruta != "app.ts" else "`backend/api/app.ts`"
        if not archivo_ruta:
            fuente = "—"
        lineas += [
            f"## {grupo}",
            "",
            f"{len(grupos[grupo])} endpoints · {fuente}",
            "",
            tabla(
                ["Método", "Ruta", "Acceso"],
                [
                    [
                        f"`{r['method']}`",
                        f"`{r['path']}`",
                        _acceso(r),
                    ]
                    for r in grupos[grupo]
                ],
            ),
            "",
        ]
    return "\n".join(lineas)


# --------------------------------------------------------------------------
# Tablas
# --------------------------------------------------------------------------

def _parsear_columnas(cuerpo: str) -> list[dict]:
    columnas = []
    fks: dict[str, str] = {}
    for linea in cuerpo.splitlines():
        limpia = linea.strip().rstrip(",")
        if not limpia or limpia.startswith("--"):
            continue
        m_fk = re.match(
            r"CONSTRAINT\s+\w+\s+FOREIGN KEY\s*\((\w+)\)\s+REFERENCES\s+"
            r"(?:public\.)?(\w+)\((\w+)\)",
            limpia,
            re.I,
        )
        if m_fk:
            fks[m_fk.group(1)] = f"{m_fk.group(2)}.{m_fk.group(3)}"
            continue
        if limpia.upper().startswith("CONSTRAINT"):
            continue
        m = re.match(
            r"(\w+)\s+(.+?)(?=\s+(?:NOT NULL|DEFAULT|CHECK|CONSTRAINT|REFERENCES)\b|$)",
            limpia,
            re.I,
        )
        if not m:
            continue
        columna, tipo = m.group(1), m.group(2).strip()
        resto = limpia[m.end():]
        notas = []
        if re.search(r"\bNOT NULL\b", resto, re.I):
            notas.append("NOT NULL")
        m_default = re.search(r"\bDEFAULT\s+([^,]+?)(?=\s+(?:NOT NULL|CHECK)\b|$)", resto, re.I)
        if m_default:
            notas.append(f"default `{m_default.group(1).strip()}`")
        m_enum = re.search(
            r"CHECK\s*\(\s*\w+::text\s*=\s*ANY\s*\(\s*ARRAY\[(.*?)\]::text\[\]\)",
            resto,
            re.I | re.S,
        )
        if m_enum:
            valores = re.findall(r"'([^']*)'", m_enum.group(1))
            notas.append("enum: " + ", ".join(valores))
        else:
            m_check = re.search(r"CHECK\s*\((.*)\)\s*$", resto, re.I)
            if m_check:
                notas.append(f"check `{m_check.group(1).strip()}`")
        columnas.append({"nombre": columna, "tipo": tipo, "notas": notas, "fk": None})
    for columna in columnas:
        if columna["nombre"] in fks:
            columna["fk"] = fks[columna["nombre"]]
    return columnas


def _schema_base() -> dict[str, dict]:
    archivo = RAIZ / "schema.sql"
    tablas: dict[str, dict] = {}
    if not archivo.exists():
        return tablas
    texto = leer(archivo)
    for m in re.finditer(r"CREATE TABLE public\.(\w+) \((.*?)\n\);", texto, re.S | re.I):
        tablas[m.group(1)] = {
            "columnas": _parsear_columnas(m.group(2)),
            "origen": "schema.sql",
        }
    return tablas


def _tablas_migraciones(tablas: dict[str, dict]) -> None:
    carpeta = RAIZ / "migrations"
    if not carpeta.exists():
        return
    for archivo in sorted(carpeta.glob("*.sql")):
        texto = leer(archivo)
        for m in re.finditer(
            r"create table(?:\s+if not exists)?\s+(?:public\.)?(\w+)\s*\((.*?)\n\);",
            texto,
            re.S | re.I,
        ):
            nombre = m.group(1)
            if nombre in tablas:
                continue
            tablas[nombre] = {
                "columnas": _parsear_columnas(m.group(2)),
                "origen": f"migrations/{archivo.name}",
            }
        for m in re.finditer(
            r"ALTER TABLE\s+(?:public\.)?(\w+)\s+(.*?);",
            texto,
            re.S | re.I,
        ):
            nombre, cuerpo = m.group(1), m.group(2)
            if nombre not in tablas:
                continue
            for col in re.finditer(
                r"ADD COLUMN(?:\s+IF NOT EXISTS)?\s+(\w+)\s+([\w\s()]+?)(?=\s+(?:DEFAULT|NOT NULL|;)|$)",
                cuerpo,
                re.I,
            ):
                columna = col.group(1)
                if any(c["nombre"] == columna for c in tablas[nombre]["columnas"]):
                    continue
                tablas[nombre]["columnas"].append({
                    "nombre": columna,
                    "tipo": col.group(2).strip(),
                    "notas": [f"migración `{archivo.name}`"],
                    "fk": None,
                })


def render_tablas() -> str:
    tablas = _schema_base()
    _tablas_migraciones(tablas)
    total_columnas = sum(len(t["columnas"]) for t in tablas.values())
    lineas = [
        "# Tablas",
        "",
        "Esquema leído de `schema.sql` más las columnas añadidas por "
        "`migrations/*.sql`.",
        "",
        f"- **{len(tablas)} tablas**, **{total_columnas} columnas**.",
        "- `schema.sql` es la base; las migraciones se aplican después, en orden "
        "de nombre.",
        "",
        "> [!warning] Deriva conocida",
        "> El backend escribe columnas que no están en `schema.sql` ni en las "
        "migraciones (`first_name`, `last_name`, …). Antes de confiar en una "
        "columna, revisa [[Deriva conocida]].",
        "",
        "## Tablas",
        "",
    ]
    lineas.append(" · ".join(f"[[#{nombre}]]" for nombre in sorted(tablas)))
    lineas.append("")
    for nombre in sorted(tablas):
        info = tablas[nombre]
        lineas += [
            f"## {nombre}",
            "",
            f"`{info['origen']}` · {len(info['columnas'])} columnas",
            "",
            tabla(
                ["Columna", "Tipo", "Notas"],
                [
                    [
                        f"`{c['nombre']}`",
                        f"`{c['tipo']}`",
                        ", ".join(
                            ([f"FK → `{c['fk']}`"] if c["fk"] else []) + c["notas"]
                        ) or "—",
                    ]
                    for c in info["columnas"]
                ],
            ),
            "",
        ]
    return "\n".join(lineas)


# --------------------------------------------------------------------------
# Web
# --------------------------------------------------------------------------

def _ruta_web(archivo: Path) -> str:
    relativo = archivo.relative_to(WEB / "app")
    partes = [
        parte for parte in relativo.parts[:-1]
        if not (parte.startswith("(") and parte.endswith(")"))
    ]
    return "/" + "/".join(partes) if partes else "/"


def render_rutas_web() -> str:
    carpeta = WEB / "app"
    if not carpeta.exists():
        return "# Rutas web\n\n> [!warning] No se encontró `web/app`."
    filas = []
    for archivo in sorted(carpeta.rglob("page.tsx")):
        texto = leer(archivo)
        relativo = archivo.relative_to(WEB).as_posix()
        ruta = _ruta_web(archivo)
        publica = "/app/(auth)/" in "/" + relativo or "(auth)" in archivo.parts
        m_roles = re.search(r"roles=\{\s*\[([^\]]*)\]\s*\}", texto, re.S)
        if m_roles:
            roles = ", ".join(re.findall(r"'([^']+)'", m_roles.group(1)))
        elif publica and "ProtectedRoute" not in texto:
            roles = "público"
        elif publica:
            roles = "con sesión"
        else:
            roles = "cualquier autenticado"
        m_pantalla = re.search(r"@/screens/([^'\"]+)", texto)
        pantalla = m_pantalla.group(1) if m_pantalla else "—"
        filas.append({
            "ruta": ruta,
            "roles": roles,
            "pantalla": pantalla,
            "archivo": relativo,
        })
    filas.sort(key=lambda f: (f["ruta"] != "/", f["ruta"]))
    lineas = [
        "# Rutas web",
        "",
        "Páginas de `web/app/**/page.tsx`: ruta, roles del `ProtectedRoute` y "
        "pantalla real que montan.",
        "",
        f"- **{len(filas)} rutas**.",
        "- `cualquier autenticado` = la página no declara `roles` pero vive en "
        "`app/(app)` y pasa por el layout protegido.",
        "- La implementación está en `web/src/screens/`; la página solo envuelve.",
        "",
        tabla(
            ["Ruta", "Acceso", "Pantalla", "Archivo"],
            [
                [
                    f"`{f['ruta']}`",
                    f["roles"],
                    f"`{f['pantalla']}`" if f["pantalla"] != "—" else "—",
                    f"`{f['archivo']}`",
                ]
                for f in filas
            ],
        ),
        "",
    ]
    return "\n".join(lineas)


def render_hooks() -> str:
    carpeta = WEB / "src" / "hooks"
    if not carpeta.exists():
        return "# Hooks y endpoints\n\n> [!warning] No se encontró `web/src/hooks`."
    patron = re.compile(r"api\.(get|post|put|patch|delete)\(\s*[`'\"]([^`'\"]+)")
    bloques = []
    total = 0
    total_archivos = 0
    for archivo in sorted(carpeta.glob("*.ts")):
        total_archivos += 1
        texto = leer(archivo)
        filas = []
        for m in patron.finditer(texto):
            linea = texto[: m.start()].count("\n") + 1
            filas.append([
                f"`{m.group(1).upper()}`",
                f"`{m.group(2)}`",
                f"{archivo.name}:{linea}",
            ])
        if filas:
            total += len(filas)
            bloques.append((archivo.name, filas))
    lineas = [
        "# Hooks y endpoints",
        "",
        "Qué hook de TanStack Query llama a qué endpoint. Se lee de "
        "`web/src/hooks/*.ts`.",
        "",
        f"- **{len(bloques)} de {total_archivos} hooks** con llamadas literales, "
        f"**{total} llamadas**.",
        "- Los hooks con URL construida en una variable aparecen abajo.",
        "- No incluye `web/src/contexts/`: el chat (SSE) vive en "
        "`ChatContext.tsx`; ver [[Chat IA]].",
        "",
    ]
    for nombre, filas in bloques:
        lineas += [
            f"## {nombre}",
            "",
            tabla(["Método", "Endpoint", "Línea"], filas),
            "",
        ]
    lineas += [
        "## Llamadas con URL dinámica",
        "",
        "El generador no puede resolver estas URLs; se mantienen a mano.",
        "",
        tabla(["Hook", "Endpoints"], [[f"`{h}`", e] for h, e in URLS_DINAMICAS]),
        "",
    ]
    return "\n".join(lineas)


# --------------------------------------------------------------------------
# Índice
# --------------------------------------------------------------------------

def _titulo_nota(archivo: Path) -> str:
    texto = leer(archivo)
    _, cuerpo = separar_frontmatter(texto)
    for linea in cuerpo.splitlines():
        if linea.startswith("# "):
            return linea[2:].strip()
    return archivo.stem


def render_indice() -> str:
    notas = [
        archivo for archivo in BOVEDA.rglob("*.md")
        if ".obsidian" not in archivo.parts
        and archivo.name not in {"README.md", "Indice completo.md"}
    ]
    grupos: dict[str, list[Path]] = {}
    for archivo in notas:
        carpeta = archivo.parent.relative_to(BOVEDA).as_posix()
        grupos.setdefault(carpeta, []).append(archivo)
    lineas = [
        "# Índice completo",
        "",
        f"{len(notas)} notas. Ordenadas por carpeta; el nombre del enlace es el "
        "título visible.",
        "",
    ]
    for carpeta in sorted(grupos):
        lineas += [f"## {carpeta}", ""]
        for archivo in sorted(grupos[carpeta], key=lambda a: a.stem.casefold()):
            titulo = _titulo_nota(archivo)
            if titulo == archivo.stem:
                lineas.append(f"- [[{archivo.stem}]]")
            else:
                lineas.append(f"- [[{archivo.stem}|{titulo}]]")
        lineas.append("")
    return "\n".join(lineas)


def brief() -> int:
    """Imprime el mapa de inicio para inyectarlo al abrir una conversación.

    No escribe nada: los hooks de Claude Code y OpenCode lo usan como contexto
    compacto. Incluye el índice calculado al vuelo para no depender de una nota
    generada que pueda estar vieja.
    """
    entrada = BOVEDA / "00-Inicio" / "Boveda Futcademic.md"
    if not entrada.exists():
        print(
            "No existe `vault/00-Inicio/Boveda Futcademic.md`; "
            "corre `python3 scripts/vault/vault.py generar`.",
            file=sys.stderr,
        )
        return 1
    cuerpo = separar_frontmatter(leer(entrada))[1].strip()
    print(cuerpo)
    print("\n---\n")
    print(render_indice())
    return 0


# --------------------------------------------------------------------------
# Comandos
# --------------------------------------------------------------------------

GENERADAS = [
    (NOTA_API, render_api, ["backend", "generado"]),
    (NOTA_TABLAS, render_tablas, ["datos", "generado"]),
    (NOTA_RUTAS_WEB, render_rutas_web, ["web", "generado"]),
    (NOTA_HOOKS, render_hooks, ["web", "generado"]),
    (NOTA_INDICE, render_indice, ["indice", "generado"]),
]


def generar() -> int:
    for ruta, render, tags in GENERADAS:
        escribir_generada(ruta, render(), tags)
        print(f"  ✓ {ruta.relative_to(RAIZ)}")
    print(f"\nBóveda generada en {BOVEDA.relative_to(RAIZ)}/")
    return 0


def _lineas_sin_codigo(texto: str) -> str:
    texto = re.sub(r"```.*?```", "", texto, flags=re.S)
    return re.sub(r"`[^`\n]*`", "", texto)


def _encabezados(texto: str) -> set[str]:
    _, cuerpo = separar_frontmatter(texto)
    cuerpo = re.sub(r"```.*?```", "", cuerpo, flags=re.S)
    return {
        normalizar(re.sub(r"\s+", " ", titulo.strip()))
        for titulo in re.findall(r"^#{1,6}[ \t]+(.+?)[ \t]*$", cuerpo, re.M)
    }


def _archivos_boveda() -> dict[str, Path]:
    archivos = {}
    for archivo in BOVEDA.rglob("*"):
        if archivo.is_file() and ".obsidian" not in archivo.parts:
            archivos.setdefault(normalizar(archivo.name), archivo)
            archivos.setdefault(normalizar(archivo.stem), archivo)
    return archivos


def _generadas_esperadas() -> dict[Path, str]:
    return {ruta: render() for ruta, render, _ in GENERADAS}


def verificar() -> int:
    errores: list[str] = []
    avisos: list[str] = []
    notas = [
        archivo for archivo in BOVEDA.rglob("*.md")
        if ".obsidian" not in archivo.parts
    ]
    archivos = _archivos_boveda()
    encabezados = {nota: _encabezados(leer(nota)) for nota in notas}

    vistos: dict[str, Path] = {}
    for nota in notas:
        clave = normalizar(nota.stem)
        if clave in vistos and vistos[clave] != nota:
            errores.append(
                f"nombre duplicado: `{nota.relative_to(BOVEDA)}` y "
                f"`{vistos[clave].relative_to(BOVEDA)}`"
            )
        vistos[clave] = nota

    for nota in notas:
        texto = leer(nota)
        cuerpo = _lineas_sin_codigo(separar_frontmatter(texto)[1])
        for enlace in re.findall(r"\[\[([^\]]+)\]\]", cuerpo):
            # En las tablas Obsidian exige escapar el pipe del alias: `\|`.
            objetivo = enlace.replace("\\|", "|").split("|")[0]
            destino, _, encabezado = objetivo.partition("#")
            destino = destino.split("^")[0].strip()
            if destino.endswith(".md"):
                destino = destino[:-3]
            nota_destino = nota
            if destino:
                clave_destino = normalizar(destino)
                if clave_destino not in archivos:
                    errores.append(
                        f"enlace roto: `{nota.relative_to(BOVEDA)}` → `[[{destino}]]`"
                    )
                    continue
                nota_destino = archivos[clave_destino]
            encabezado = encabezado.split("^")[0].strip()
            if encabezado and normalizar(encabezado) not in encabezados.get(nota_destino, set()):
                errores.append(
                    f"encabezado inexistente: `{nota.relative_to(BOVEDA)}` → "
                    f"`[[{enlace}]]`"
                )

        datos = parsear_frontmatter(texto)
        if datos.get("tipo") != "generado":
            fuentes = datos.get("fuentes") or []
            if isinstance(fuentes, str):
                fuentes = [fuentes]
            actualizado = datos.get("actualizado")
            for fuente in fuentes:
                ruta = RAIZ / fuente
                if not ruta.exists():
                    errores.append(
                        f"fuente inexistente: `{nota.relative_to(BOVEDA)}` → `{fuente}`"
                    )
                    continue
                if not actualizado or not ruta.is_file():
                    continue
                try:
                    fecha_nota = datetime.strptime(str(actualizado), "%Y-%m-%d").date()
                except ValueError:
                    errores.append(
                        f"fecha inválida en `{nota.relative_to(BOVEDA)}`: {actualizado}"
                    )
                    continue
                mtime = datetime.fromtimestamp(ruta.stat().st_mtime).date()
                if mtime > fecha_nota:
                    avisos.append(
                        f"posible desactualización: `{nota.relative_to(BOVEDA)}` "
                        f"(fuente `{fuente}` modificada el {mtime}; nota fechada "
                        f"{fecha_nota})"
                    )

    esperadas = _generadas_esperadas()
    for ruta, cuerpo in esperadas.items():
        if not ruta.exists():
            errores.append(f"falta nota generada: `{ruta.relative_to(BOVEDA)}`")
            continue
        datos = parsear_frontmatter(leer(ruta))
        huella = hashlib.sha256((cuerpo.strip() + "\n").encode("utf-8")).hexdigest()[:12]
        if datos.get("hash") != huella:
            avisos.append(
                f"nota generada obsoleta: `{ruta.relative_to(BOVEDA)}` "
                "(corre `python3 scripts/vault/vault.py generar`)"
            )

    print(f"Bóveda: {len(notas)} notas")
    print(f"Errores: {len(errores)} · Avisos: {len(avisos)}")
    for error in errores:
        print(f"  ✗ {error}")
    for aviso in avisos:
        print(f"  ! {aviso}")
    return 1 if errores else 0


def main(argv: list[str]) -> int:
    if len(argv) != 2 or argv[1] not in {"generar", "verificar", "brief"}:
        print(__doc__.strip())
        return 2
    if argv[1] == "generar":
        return generar()
    if argv[1] == "verificar":
        return verificar()
    return brief()


if __name__ == "__main__":
    sys.exit(main(sys.argv))
