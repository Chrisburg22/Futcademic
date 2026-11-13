# `entrenar_vista.py` (Minería)

Código fuente completo, Python 3.

```python
#!/usr/bin/env python3
"""
Entrena el Modelo A sobre la vista minable y lo contrasta con scikit-learn.

  1. Arbol CART propio (solo libreria estandar), el mismo de validar_dataset.py.
  2. Si scikit-learn esta instalado, DecisionTreeClassifier con los mismos
     parametros, mas una validacion cruzada agrupada por alumno.

Entrada : mineria/real/vista_minable.csv   (generada por vista_minable.py)
Uso     : python3 mineria/entrenar_vista.py
          (para el contraste: pip install scikit-learn pandas)
"""
import csv
import json
import os

import validar_dataset as v

AQUI = os.path.dirname(os.path.abspath(__file__))
VISTA = os.path.join(AQUI, "real", "vista_minable.csv")
INFORME = os.path.join(AQUI, "real", "vista_minable_informe.json")
COLS = ["edad", "n_previas", "tasa_previa", "tasa_ultimas3", "racha_faltas",
        "dias_desde_ultima", "mes", "dia_semana"]
ETQ = "falta_siguiente"


def cargar():
    filas = list(csv.DictReader(open(VISTA, encoding="utf-8")))
    for r in filas:
        for c in COLS + [ETQ]:
            r[c] = float(r[c])
    return filas


def top25(scores, y):
    """Marca exactamente el 25 % de filas con mayor riesgo.

    Las hojas del árbol dan pocos valores distintos; con un umbral, los empates
    marcarían mucho más del 25 %. Se ordena por riesgo y, en empate, se conserva
    el orden original (estable), para marcar justo k filas.
    """
    k = max(1, round(len(y) * 0.25))
    idx = sorted(range(len(y)), key=lambda i: -scores[i])[:k]
    marcados = set(idx)
    vp = sum(1 for i in marcados if y[i] == 1)
    fp = k - vp
    fn = sum(y) - vp
    vn = len(y) - k - fn
    m = {"vp": vp, "fp": fp, "fn": fn, "vn": vn, "marcado": k / len(y),
         "precision": vp / k, "recall": vp / sum(y) if sum(y) else 0}
    base = sum(y) / len(y)
    return m, m["precision"] / base if base else 0

def main():
    v.ETIQUETA = ETQ
    filas = cargar()
    # El corte lo fija vista_minable.py en su informe: una sola fuente de verdad.
    corte = json.load(open(INFORME, encoding="utf-8"))["corte_temporal"]
    train = [r for r in filas if r["fecha"] < corte]
    test = [r for r in filas if r["fecha"] >= corte]
    y_tr = [int(r[ETQ]) for r in train]
    y_te = [int(r[ETQ]) for r in test]

    print("VISTA: %d filas · entrena %d (antes de %s) · prueba %d" % (len(filas), len(train), corte, len(test)))
    print("faltas: entrenamiento %d (%.1f %%) · prueba %d (%.1f %%)" % (
        sum(y_tr), 100 * sum(y_tr) / len(y_tr), sum(y_te), 100 * sum(y_te) / len(y_te)))

    print("\n== 1. Arbol CART propio (Gini, profundidad %d, hoja minima %d) ==" % (v.PROFUNDIDAD_MAX, v.MIN_HOJA))
    arbol = v.construir(train, COLS)
    s_te = [v.predecir(arbol, r) for r in test]
    s_tr = [v.predecir(arbol, r) for r in train]
    auc_te, auc_tr = v.auc(s_te, y_te), v.auc(s_tr, y_tr)
    m, lift = top25(s_te, y_te)
    v.imprimir_arbol(arbol)
    print("AUC entrenamiento %.3f · AUC prueba %.3f · sobreajuste %.3f" % (auc_tr, auc_te, auc_tr - auc_te))
    print("Marcando 25 %% (real %.1f %%): precision %.3f · recall %.3f · lift %.2fx · VP=%d FP=%d FN=%d VN=%d" % (
        100 * m["marcado"], m["precision"], m["recall"], lift, m["vp"], m["fp"], m["fn"], m["vn"]))

    base_auc = v.auc([r["tasa_previa"] * -1 for r in test], y_te)
    print("Referencia sin modelo (solo -tasa_previa): AUC prueba %.3f" % base_auc)

    try:
        import numpy as np
        from sklearn.metrics import roc_auc_score
        from sklearn.model_selection import GroupKFold
        from sklearn.tree import DecisionTreeClassifier
    except ImportError:
        print("\n(scikit-learn no instalado: se omite el contraste)")
        return

    print("\n== 2. Contraste con scikit-learn ==")
    X_tr = np.array([[r[c] for c in COLS] for r in train])
    X_te = np.array([[r[c] for c in COLS] for r in test])
    clf = DecisionTreeClassifier(criterion="gini", max_depth=v.PROFUNDIDAD_MAX,
                                 min_samples_leaf=v.MIN_HOJA, random_state=0)
    clf.fit(X_tr, y_tr)
    p_te = clf.predict_proba(X_te)[:, 1]
    p_tr = clf.predict_proba(X_tr)[:, 1]
    print("AUC entrenamiento %.3f · AUC prueba %.3f" % (roc_auc_score(y_tr, p_tr), roc_auc_score(y_te, p_te)))
    m2, lift2 = top25(list(p_te), y_te)
    print("Marcando 25 %% (real %.1f %%): precision %.3f · recall %.3f · lift %.2fx" % (100 * m2["marcado"], m2["precision"], m2["recall"], lift2))
    imp = sorted(zip(clf.feature_importances_, COLS), reverse=True)
    print("Importancia:", ", ".join("%s %.2f" % (c, i) for i, c in imp if i > 0))

    # Validación por alumno Y por fecha: cada pliegue entrena con otros alumnos
    # antes del corte y evalúa a sus alumnos después del corte. Así no se filtra
    # ni el alumno ni lo que pasó en la misma sesión.
    X = np.array([[r[c] for c in COLS] for r in filas])
    y = np.array([int(r[ETQ]) for r in filas])
    g = np.array([r["alumno"] for r in filas])
    antes = np.array([r["fecha"] < corte for r in filas])
    aucs = []
    for a, b in GroupKFold(n_splits=5).split(X, y, g):
        a, b = a[antes[a]], b[~antes[b]]
        if len(set(y[b])) < 2:
            continue
        c2 = DecisionTreeClassifier(criterion="gini", max_depth=v.PROFUNDIDAD_MAX,
                                    min_samples_leaf=v.MIN_HOJA, random_state=0).fit(X[a], y[a])
        aucs.append(roc_auc_score(y[b], c2.predict_proba(X[b])[:, 1]))
    print("Validacion por alumno y fecha (5 pliegues): AUC %s · media %.3f" % (
        " ".join("%.3f" % x for x in aucs), sum(aucs) / len(aucs)))

if __name__ == "__main__":
    main()
```
