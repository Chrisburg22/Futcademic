#!/usr/bin/env python3
"""
Vista minable (etapas 1-4 de KDD) del Modelo A: ¿faltara a su siguiente sesion?

Parte de la hoja de calculo de Gallos San Rafael Serratos ya extraida a JSON y
deja una tabla lista para minar, contando que se pierde en cada etapa.

  1. Limpieza        fechas futuras, fechas de nacimiento imposibles, alumnos repetidos
  2. Integracion     12 pestanas -> una sola tabla alumno/sesion (llave: nombre + nacimiento; repetidos se unen)
  3. Seleccion       atributos, tipo, valores posibles y valores atipicos (IQR)
  4. Transformacion  atributos derivados con ventana previa, etiqueta, seudonimo, particion

Entrada : scripts/serratos_data.json           (contiene nombres: NO se publica)
          scripts/serratos_data_filtrado.json  (solo alumnos con fecha de nacimiento)
Salida  : mineria/real/vista_minable.csv       (anonima)
          mineria/real/vista_minable_informe.json

Uso:  python3 mineria/vista_minable.py
"""
import csv
import json
import os
import statistics as st
from collections import Counter
from datetime import date

AQUI = os.path.dirname(os.path.abspath(__file__))
CRUDO = os.path.join(AQUI, "..", "scripts", "serratos_data.json")
FILTRADO = os.path.join(AQUI, "..", "scripts", "serratos_data_filtrado.json")
SALIDA = os.path.join(AQUI, "real")

HOY = "2026-10-22"
EDAD_MIN, EDAD_MAX = 3, 18            # rango plausible de una academia infantil y juvenil
COLUMNAS = ["alumno", "fecha", "edad", "n_previas", "tasa_previa", "tasa_ultimas3",
            "racha_faltas", "dias_desde_ultima", "mes", "dia_semana", "falta_siguiente"]
ATRIBUTOS = ["edad", "n_previas", "tasa_previa", "tasa_ultimas3", "racha_faltas",
             "dias_desde_ultima", "mes", "dia_semana"]


def dias(a, b):
    return (date.fromisoformat(a) - date.fromisoformat(b)).days


def main():
    inf = {}
    crudo = json.load(open(CRUDO, encoding="utf-8"))
    filtrado = json.load(open(FILTRADO, encoding="utf-8"))

    # ---------- 1. LIMPIEZA ----------
    inf["pestanas_con_datos"] = len(filtrado["hojas"])
    inf["pestanas_total"] = len(crudo["hojas"])
    inf["alumnos_hoja"] = sum(len(h["alumnos"]) for h in crudo["hojas"])
    inf["sin_fecha_nacimiento"] = sum(1 for h in crudo["hojas"] for a in h["alumnos"] if not a.get("fecha_nac"))
    inf["marcas_AF"] = sum(len(a["asistencias"]) for h in filtrado["hojas"] for a in h["alumnos"])
    inf["marcas_futuras"] = sum(1 for h in filtrado["hojas"] for a in h["alumnos"]
                                for x in a["asistencias"] if x["fecha"] > HOY)
    otros = Counter()
    for h in crudo["hojas"]:
        for a in h["alumnos"]:
            for k, n in (a.get("sin_clasificar") or {}).items():
                otros[k] += n if isinstance(n, int) else 1
    inf["codigos_no_asistencia"] = dict(otros)

    # Integración: un alumno que aparece en varias pestañas se une por la llave
    # (nombre, nacimiento) y sus marcas se combinan; si dos pestañas marcan la
    # misma fecha, se conserva la primera.
    por_clave, imposibles, repetidos = {}, 0, 0
    for h in filtrado["hojas"]:
        for a in h["alumnos"]:
            edad = 2026 - int(a["fecha_nac"][:4])
            if not (EDAD_MIN <= edad <= EDAD_MAX):
                imposibles += 1
                continue
            clave = (a["nombre"].lower(), a["fecha_nac"])
            if clave in por_clave:
                repetidos += 1
            else:
                por_clave[clave] = {"hoja": h["hoja"], "edad": edad, "por_fecha": {}}
            pf = por_clave[clave]["por_fecha"]
            for x in a["asistencias"]:
                if x["fecha"] <= HOY:
                    pf.setdefault(x["fecha"], x)
    alumnos = [{"hoja": v["hoja"], "edad": v["edad"],
                "marcas": [v["por_fecha"][f] for f in sorted(v["por_fecha"])]}
               for v in por_clave.values()]
    inf["edad_fuera_de_rango"] = imposibles
    inf["alumnos_repetidos_unidos"] = repetidos
    # Quien nunca asistió ya no está activo: sus filas son positivos triviales
    # (tasa 0, etiqueta 1) que inflarían el AUC. Se excluyen.
    sin_asistencia = [a for a in alumnos if a["marcas"] and not any(x["present"] for x in a["marcas"])]
    inf["alumnos_sin_ninguna_asistencia"] = len(sin_asistencia)
    inf["alumnos_unicos"] = len(alumnos)
    inf["alumnos_sin_marcas"] = sum(1 for a in alumnos if not a["marcas"])
    alumnos = [a for a in alumnos if not a["marcas"] or any(x["present"] for x in a["marcas"])]
    inf["alumnos_limpios"] = len(alumnos)
    inf["marcas_limpias"] = sum(len(a["marcas"]) for a in alumnos)
    inf["alumnos_con_1_marca_o_menos"] = sum(1 for a in alumnos if len(a["marcas"]) < 2)

    # ---------- 2 y 4. INTEGRACION + TRANSFORMACION ----------
    filas = []
    for n, a in enumerate((x for x in alumnos if len(x["marcas"]) >= 2), start=1):
        marcas = a["marcas"]
        for i in range(1, len(marcas)):
            previas = marcas[:i]
            ult = previas[-3:]
            racha = 0
            for x in reversed(previas):
                if x["present"]:
                    break
                racha += 1
            f = date.fromisoformat(marcas[i]["fecha"])
            filas.append({
                "alumno": "A%03d" % n, "fecha": marcas[i]["fecha"], "edad": a["edad"],
                "n_previas": i,
                "tasa_previa": round(sum(x["present"] for x in previas) / i, 4),
                "tasa_ultimas3": round(sum(x["present"] for x in ult) / len(ult), 4),
                "racha_faltas": racha,
                "dias_desde_ultima": dias(marcas[i]["fecha"], previas[-1]["fecha"]),
                "mes": f.month, "dia_semana": f.weekday(),
                "falta_siguiente": int(not marcas[i]["present"]),
            })
    os.makedirs(SALIDA, exist_ok=True)
    with open(os.path.join(SALIDA, "vista_minable.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNAS)
        w.writeheader()
        w.writerows(filas)

    inf["alumnos_en_vista"] = len({r["alumno"] for r in filas})
    inf["filas"] = len(filas)
    inf["fechas"] = len({r["fecha"] for r in filas})
    inf["primera_fecha"] = min(r["fecha"] for r in filas)
    inf["ultima_fecha"] = max(r["fecha"] for r in filas)
    inf["faltas"] = sum(r["falta_siguiente"] for r in filas)
    inf["tasa_falta"] = round(inf["faltas"] / len(filas), 4)
    fechas = sorted({r["fecha"] for r in filas})
    inf["corte_temporal"] = fechas[int(len(fechas) * 0.7)]
    inf["filas_entrenamiento"] = sum(1 for r in filas if r["fecha"] < inf["corte_temporal"])
    inf["filas_prueba"] = len(filas) - inf["filas_entrenamiento"]

    # ---------- 3. SELECCION: perfil de atributos ----------
    perfil = {}
    for c in ATRIBUTOS + ["falta_siguiente"]:
        xs = [float(r[c]) for r in filas]
        q1, _, q3 = st.quantiles(xs, n=4, method="inclusive")
        iqr = q3 - q1
        lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        valores = sorted(set(xs))
        perfil[c] = {
            "min": min(xs), "max": max(xs), "media": round(st.mean(xs), 3),
            "mediana": st.median(xs), "q1": q1, "q3": q3,
            "atipicos_iqr": sum(1 for x in xs if x < lo or x > hi),
            "distintos": len(valores),
            "valores": valores if len(valores) <= 14 else None,
        }
    inf["perfil"] = perfil
    inf["racha_distribucion"] = sorted(Counter(int(r["racha_faltas"]) for r in filas).items())
    inf["edad_distribucion"] = sorted(Counter(int(r["edad"]) for r in filas).items())
    inf["dias_distribucion"] = sorted(Counter(int(r["dias_desde_ultima"]) for r in filas).items())
    inf["mes_distribucion"] = sorted(Counter(int(r["mes"]) for r in filas).items())
    inf["clase_distribucion"] = sorted(Counter(int(r["falta_siguiente"]) for r in filas).items())

    with open(os.path.join(SALIDA, "vista_minable_informe.json"), "w", encoding="utf-8") as fh:
        json.dump(inf, fh, ensure_ascii=False, indent=2)

    print(json.dumps(inf, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
