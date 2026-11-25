#!/usr/bin/env python3
"""
Exporta el Modelo A entrenado a JSON para que el backend lo sirva sin Python.

El arbol tiene 9 hojas: cabe en un archivo que se revisa en un diff y se
revierte con git. Una tabla de pesos en la base seria un modelo que nadie
puede leer.

  python3 mineria/exportar_modelo.py [ruta/del/model.json]

Por defecto escribe en backend/api/services/risk/model.json si existe la
carpeta; si no, en mineria/real/model.json.
"""
import json
import os
import sys

import entrenar_vista as e
import validar_dataset as v

AQUI = os.path.dirname(os.path.abspath(__file__))


def a_dict(nodo):
    """El arbol de validar_dataset.construir -> JSON plano.

    Las claves del arbol en memoria (`hoja`, `col`, `val`, `p`, `izq`, `der`)
    se traducen a nombres legibles: el JSON lo lee una persona en un diff.
    """
    if nodo["hoja"]:
        return {"tipo": "hoja", "riesgo": round(float(nodo["p"]), 6), "n": nodo.get("n")}
    return {
        "tipo": "corte",
        "variable": nodo["col"],
        "umbral": float(nodo["val"]),
        "n": nodo.get("n"),
        # `si` = la rama donde variable <= umbral, igual que en validar_dataset.
        "si": a_dict(nodo["izq"]),
        "no": a_dict(nodo["der"]),
    }


def main():
    v.ETIQUETA = e.ETQ
    filas = e.cargar()
    informe = json.load(open(os.path.join(AQUI, "real", "vista_minable_informe.json"), encoding="utf-8"))
    corte = informe["corte_temporal"]

    train = [r for r in filas if r["fecha"] < corte]
    test = [r for r in filas if r["fecha"] >= corte]
    arbol = v.construir(train, e.COLS)

    y_te = [int(r[e.ETQ]) for r in test]
    s_te = [v.predecir(arbol, r) for r in test]
    metricas, lift = e.top25(s_te, y_te)

    modelo = {
        "nombre": "modelo-a-falta-siguiente",
        "version": informe.get("extraido_en", "")[:10] or "sin-fecha",
        "entrenado_con": {
            "fuente": informe.get("fuente"),
            "filas": len(filas),
            "filas_entrenamiento": len(train),
            "filas_prueba": len(test),
            "alumnos": informe.get("alumnos_en_vista"),
            "corte_temporal": corte,
            "tasa_falta": informe.get("tasa_falta"),
        },
        "metricas": {
            "auc_prueba": round(v.auc(s_te, y_te), 4),
            "auc_entrenamiento": round(v.auc([v.predecir(arbol, r) for r in train],
                                             [int(r[e.ETQ]) for r in train]), 4),
            "referencia_tasa_previa": round(v.auc([r["tasa_previa"] * -1 for r in test], y_te), 4),
            "precision_top25": round(metricas["precision"], 4),
            "recall_top25": round(metricas["recall"], 4),
            "lift_top25": round(lift, 4),
        },
        "variables": e.COLS,
        "parametros": {"profundidad_max": v.PROFUNDIDAD_MAX, "min_hoja": v.MIN_HOJA},
        # Cortes de banda: las hojas del arbol caen a ambos lados de estos dos
        # numeros. Se recalibran con risk_predictions, no a ojo en la pantalla.
        "bandas": {"medio": 0.15, "alto": 0.30},
        "arbol": a_dict(arbol),
    }

    destino = sys.argv[1] if len(sys.argv) > 1 else None
    if not destino:
        candidato = os.path.join(AQUI, "..", "..", "..", "backend", "api", "services", "risk")
        destino = (os.path.join(candidato, "model.json") if os.path.isdir(candidato)
                   else os.path.join(AQUI, "real", "model.json"))

    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "w", encoding="utf-8") as fh:
        json.dump(modelo, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print("Modelo escrito en %s" % os.path.normpath(destino))
    print("AUC prueba %.3f (referencia %.3f) · lift %.2fx" % (
        modelo["metricas"]["auc_prueba"],
        modelo["metricas"]["referencia_tasa_previa"],
        modelo["metricas"]["lift_top25"]))


if __name__ == "__main__":
    main()
