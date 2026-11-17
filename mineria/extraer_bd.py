#!/usr/bin/env python3
"""
Paso 1 de KDD (selección de la fuente): extrae de la base de producción de
Futcademic (Supabase) lo que necesita la vista minable.

Lee solo las columnas necesarias, sin nombres, teléfonos, direcciones ni notas
médicas:
  schools      id, name
  students     id, school_id, category_id, birth_date, status, created_at
  attendances  student_id, school_id, date, present, created_at
  deleted_students  school_id, original_student_id, deleted_at

Credenciales: variables de entorno SUPABASE_URL y SUPABASE_SERVICE_KEY. Si no
están, se leen del archivo indicado en FUTCADEMIC_ENV o de backend/.env del
repositorio. Nunca se escriben en la salida.

Salida : mineria/bd/extraccion_bd.json   (privada: lleva identificadores y
         fechas de nacimiento; la carpeta está en .gitignore)

Uso:  python3 mineria/extraer_bd.py
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(AQUI, "bd", "extraccion_bd.json")
PAGINA = 1000

TABLAS = {
    "schools": "id,name",
    "students": "id,school_id,category_id,birth_date,status,created_at",
    "attendances": "student_id,school_id,date,present,created_at",
    "deleted_students": "school_id,original_student_id,deleted_at",
}


def credenciales():
    url, key = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_KEY")
    if url and key:
        return url, key
    candidatos = [os.environ.get("FUTCADEMIC_ENV"),
                  os.path.join(AQUI, "..", "backend", ".env")]
    for ruta in filter(None, candidatos):
        if os.path.isfile(ruta):
            env = {}
            for linea in open(ruta, encoding="utf-8"):
                if "=" in linea and not linea.lstrip().startswith("#"):
                    k, v = linea.strip().split("=", 1)
                    env[k] = v.strip().strip('"').strip("'")
            url = url or env.get("SUPABASE_URL")
            key = key or env.get("SUPABASE_SERVICE_KEY") or env.get("SUPABASE_SERVICE_ROLE_KEY")
            if url and key:
                return url, key
    sys.exit("Faltan SUPABASE_URL y SUPABASE_SERVICE_KEY (variables de entorno o FUTCADEMIC_ENV).")


def leer_tabla(url, key, tabla, columnas):
    filas, desde = [], 0
    while True:
        q = urllib.parse.urlencode({"select": columnas, "order": "id" if "id" in columnas.split(",") else "created_at"})
        if tabla == "deleted_students":
            q = urllib.parse.urlencode({"select": columnas})
        req = urllib.request.Request(
            "%s/rest/v1/%s?%s" % (url.rstrip("/"), tabla, q),
            headers={"apikey": key, "Authorization": "Bearer " + key,
                     "Range-Unit": "items", "Range": "%d-%d" % (desde, desde + PAGINA - 1)})
        with urllib.request.urlopen(req, timeout=60) as r:
            lote = json.load(r)
        filas += lote
        if len(lote) < PAGINA:
            return filas
        desde += PAGINA


def main():
    url, key = credenciales()
    datos = {"extraido_en": datetime.now(timezone.utc).isoformat(timespec="seconds")}
    for tabla, cols in TABLAS.items():
        datos[tabla] = leer_tabla(url, key, tabla, cols)
        print("%-17s %6d filas" % (tabla, len(datos[tabla])))
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8") as fh:
        json.dump(datos, fh, ensure_ascii=False)
    print("Guardado en %s" % os.path.relpath(SALIDA, os.path.join(AQUI, "..")))


if __name__ == "__main__":
    main()
