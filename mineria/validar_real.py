#!/usr/bin/env python3
"""
Modelo REAL: predecir si un alumno faltara a su siguiente sesion.

Usa solo asistencia real de Gallos San Rafael Serratos (hoja de calculo de la
academia, cargada a produccion). Sin datos sinteticos.

Entrada : scripts/serratos_data_filtrado.json   (contiene nombres: NO se publica)
Salida  : mineria/real/dataset_real.csv         (anonimo: sin nombre ni fecha de nacimiento)

Por cada alumno se ordenan sus marcas por fecha. Para cada marca i >= 1 se calculan
atributos con lo ocurrido ANTES (marcas[:i]) y la etiqueta es si en marcas[i] falto.
Asi nunca se usa el futuro para predecir. Las marcas posteriores al 22/oct/2026 se
excluyen: son fechas que aun no ocurren.

Uso:  python3 mineria/validar_real.py
"""
import csv
import json
import os
from datetime import date

import validar_dataset as v

AQUI = os.path.dirname(os.path.abspath(__file__))
FUENTE = os.path.join(AQUI, "..", "scripts", "serratos_data_filtrado.json")
SALIDA = os.path.join(AQUI, "real")
HOY = "2026-10-22"

COLUMNAS = ["alumno", "fecha", "edad", "n_previas", "tasa_previa", "tasa_ultimas3",
            "racha_faltas", "dias_desde_ultima", "mes", "dia_semana", "falta_siguiente"]


def dias(a, b):
    return (date.fromisoformat(a) - date.fromisoformat(b)).days


def construir_filas():
    d = json.load(open(FUENTE, encoding="utf-8"))
    filas, vistos = [], set()
    for h in d["hojas"]:
        for a in h["alumnos"]:
            clave = (a["nombre"].lower(), a["fecha_nac"])
            if clave in vistos:                  # alumno repetido entre hojas
                continue
            vistos.add(clave)
            marcas = sorted((x for x in a["asistencias"] if x["fecha"] <= HOY), key=lambda x: x["fecha"])
            edad = 2026 - int(a["fecha_nac"][:4])
            alumno = "A%03d" % len(vistos)       # seudonimo: el nombre no sale de aqui
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
                    "alumno": alumno, "fecha": marcas[i]["fecha"], "edad": edad,
                    "n_previas": i,
                    "tasa_previa": round(sum(x["present"] for x in previas) / i, 4),
                    "tasa_ultimas3": round(sum(x["present"] for x in ult) / len(ult), 4),
                    "racha_faltas": racha,
                    "dias_desde_ultima": dias(marcas[i]["fecha"], previas[-1]["fecha"]),
                    "mes": f.month, "dia_semana": f.weekday(),
                    "falta_siguiente": int(not marcas[i]["present"]),
                })
    return filas


def main():
    filas = construir_filas()
    os.makedirs(SALIDA, exist_ok=True)
    with open(os.path.join(SALIDA, "dataset_real.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNAS)
        w.writeheader()
        w.writerows(filas)

    v.ETIQUETA = "falta_siguiente"
    cols = ["edad", "n_previas", "tasa_previa", "tasa_ultimas3", "racha_faltas",
            "dias_desde_ultima", "mes", "dia_semana"]
    fechas = sorted({r["fecha"] for r in filas})
    corte = fechas[int(len(fechas) * 0.7)]
    train = [r for r in filas if r["fecha"] < corte]
    test = [r for r in filas if r["fecha"] >= corte]
    y_tr = [r["falta_siguiente"] for r in train]
    y_te = [r["falta_siguiente"] for r in test]

    print("=" * 66)
    print("MODELO REAL -- ¿faltara a su siguiente sesion?  (Serratos, sin sinteticos)")
    print("=" * 66)
    print("filas ................ %d  (alumnos distintos: %d)" % (len(filas), len({r['alumno'] for r in filas})))
    print("fechas distintas ..... %d  (%s a %s)" % (len(fechas), fechas[0], fechas[-1]))
    print("faltas ............... %d  (%.1f %%)" % (sum(y_tr) + sum(y_te), 100 * (sum(y_tr) + sum(y_te)) / len(filas)))
    print("particion temporal en  %s" % corte)
    print("   entrenamiento ..... %d filas, %d faltas (%.1f %%)" % (len(train), sum(y_tr), 100 * sum(y_tr) / len(train)))
    print("   prueba ............ %d filas, %d faltas (%.1f %%)" % (len(test), sum(y_te), 100 * sum(y_te) / len(test)))

    print("\nAUC individual de cada variable (conjunto completo)")
    y = [r["falta_siguiente"] for r in filas]
    rank = []
    for c in cols:
        a = v.auc([r[c] for r in filas], y)
        if a == a:
            rank.append((max(a, 1 - a), a, c))
    for fuerza, a, c in sorted(rank, reverse=True):
        print("  %-20s AUC %.3f  %s" % (c, a, "mas alto = mas riesgo" if a > 0.5 else "mas bajo = mas riesgo"))

    arbol = v.construir(train, cols)
    s_te = [v.predecir(arbol, r) for r in test]
    s_tr = [v.predecir(arbol, r) for r in train]
    auc_te, auc_tr = v.auc(s_te, y_te), v.auc(s_tr, y_tr)
    base = sum(y_te) / len(y_te)
    orden = sorted(s_te, reverse=True)
    umbral = orden[max(0, int(len(orden) * 0.25) - 1)]
    m = v.metricas(s_te, y_te, umbral)

    print("\nARBOL CART (profundidad %d)" % v.PROFUNDIDAD_MAX)
    v.imprimir_arbol(arbol)
    print("\n  AUC entrenamiento .. %.3f" % auc_tr)
    print("  AUC prueba ......... %.3f" % auc_te)
    print("  sobreajuste ........ %.3f" % (auc_tr - auc_te))
    print("  marcando al 25 % como 'riesgo de falta':")
    print("    precision ........ %.3f   recall ... %.3f   F1 ... %.3f" % (m["precision"], m["recall"], m["f1"]))
    print("    lift sobre la tasa base (%.1f %%): %.2fx" % (100 * base, m["precision"] / base if base else 0))
    print("    matriz: VP=%d FP=%d FN=%d VN=%d" % (m["vp"], m["fp"], m["fn"], m["vn"]))


if __name__ == "__main__":
    main()
