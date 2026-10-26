#!/usr/bin/env python3
"""
Validacion del dataset sintetico de Futcademic + linea base del objetivo O1
(prediccion de desercion a 30 dias).

Responde dos preguntas que hay que contestar ANTES de presentar el proyecto:

  1. .Tiene senal el dataset?  Si un arbol no supera a la regla trivial
     "nadie deserta", el generador produjo ruido y no sirve.
  2. .Es demasiado facil?  Si el arbol acierta casi perfecto, el generador
     dejo una fuga de informacion y el experimento no vale.

El punto dulce para un proyecto de mineria: AUC entre 0.75 y 0.92.

Implementa un CART (indice Gini) con la biblioteca estandar, sin dependencias.
La particion es TEMPORAL: se entrena con los cortes viejos y se prueba con los
recientes, que es como se usaria el modelo en produccion y evita que el mismo
alumno aparezca en ambos lados.

Uso:
    python3 mineria/validar_dataset.py
"""

import csv
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
CSV_ML = os.path.join(AQUI, "dataset", "dataset_ml.csv")

# 'perfil_latente' es la verdad oculta del generador, 'student_id' identifica al
# individuo y 'origen' dice si la academia es simulada: ninguna puede ser
# predictor. Que el modelo se agarrara de 'origen' seria aprender como se genero
# el conjunto, no como se comporta un alumno.
EXCLUIDAS = {"student_id", "fecha_corte", "perfil_latente", "origen", "deserta_30d"}
CATEGORICAS = {"escuela", "categoria", "status", "origen"}

# Columna objetivo de gini()/construir(). validar_real.py la cambia para reutilizar el arbol.
ETIQUETA = "deserta_30d"

PROFUNDIDAD_MAX = 4
MIN_HOJA = 15


def cargar():
    with open(CSV_ML, newline="", encoding="utf-8") as f:
        filas = list(csv.DictReader(f))
    for r in filas:
        for k, v in r.items():
            if k not in CATEGORICAS and k not in ("student_id", "fecha_corte",
                                                  "perfil_latente"):
                try:
                    r[k] = float(v)
                except ValueError:
                    pass
    return filas


def columnas_numericas(filas):
    return [c for c in filas[0].keys()
            if c not in EXCLUIDAS and c not in CATEGORICAS]


# ---------------------------------------------------------------------------
# Metricas
# ---------------------------------------------------------------------------

def auc(scores, etiquetas):
    """AUC-ROC por conteo de pares concordantes (equivale al test de Mann-Whitney)."""
    pares = sorted(zip(scores, etiquetas))
    pos = sum(etiquetas)
    neg = len(etiquetas) - pos
    if pos == 0 or neg == 0:
        return float("nan")
    # rangos con promedio en los empates
    rangos = {}
    i = 0
    suma_rangos_pos = 0.0
    while i < len(pares):
        j = i
        while j + 1 < len(pares) and pares[j + 1][0] == pares[i][0]:
            j += 1
        rango_medio = (i + j) / 2.0 + 1
        for k in range(i, j + 1):
            if pares[k][1] == 1:
                suma_rangos_pos += rango_medio
        i = j + 1
    return (suma_rangos_pos - pos * (pos + 1) / 2.0) / (pos * neg)


def metricas(scores, etiquetas, umbral=0.5):
    vp = sum(1 for s, y in zip(scores, etiquetas) if s >= umbral and y == 1)
    fp = sum(1 for s, y in zip(scores, etiquetas) if s >= umbral and y == 0)
    fn = sum(1 for s, y in zip(scores, etiquetas) if s < umbral and y == 1)
    vn = sum(1 for s, y in zip(scores, etiquetas) if s < umbral and y == 0)
    prec = vp / (vp + fp) if vp + fp else 0.0
    rec = vp / (vp + fn) if vp + fn else 0.0
    f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
    return {"vp": vp, "fp": fp, "fn": fn, "vn": vn,
            "precision": prec, "recall": rec, "f1": f1}


# ---------------------------------------------------------------------------
# CART minimo
# ---------------------------------------------------------------------------

def gini(filas):
    n = len(filas)
    if n == 0:
        return 0.0
    p = sum(r[ETIQUETA] for r in filas) / n
    return 2 * p * (1 - p)


def mejor_corte(filas, cols):
    base = gini(filas)
    n = len(filas)
    mejor = None
    for c in cols:
        valores = sorted(set(r[c] for r in filas))
        if len(valores) < 2:
            continue
        # se prueban los puntos medios entre valores consecutivos
        candidatos = [(valores[i] + valores[i + 1]) / 2.0
                      for i in range(len(valores) - 1)]
        if len(candidatos) > 40:            # submuestreo para no explotar
            paso = len(candidatos) // 40
            candidatos = candidatos[::paso]
        for v in candidatos:
            izq = [r for r in filas if r[c] <= v]
            der = [r for r in filas if r[c] > v]
            if len(izq) < MIN_HOJA or len(der) < MIN_HOJA:
                continue
            g = (len(izq) * gini(izq) + len(der) * gini(der)) / n
            ganancia = base - g
            if mejor is None or ganancia > mejor[0]:
                mejor = (ganancia, c, v, izq, der)
    return mejor


def construir(filas, cols, profundidad=0):
    tasa = sum(r[ETIQUETA] for r in filas) / len(filas) if filas else 0.0
    nodo = {"hoja": True, "p": tasa, "n": len(filas)}
    if profundidad >= PROFUNDIDAD_MAX or len(filas) < 2 * MIN_HOJA or tasa in (0.0, 1.0):
        return nodo
    corte = mejor_corte(filas, cols)
    if corte is None or corte[0] <= 1e-6:
        return nodo
    _, col, val, izq, der = corte
    return {"hoja": False, "col": col, "val": val, "n": len(filas),
            "izq": construir(izq, cols, profundidad + 1),
            "der": construir(der, cols, profundidad + 1)}


def predecir(nodo, fila):
    while not nodo["hoja"]:
        nodo = nodo["izq"] if fila[nodo["col"]] <= nodo["val"] else nodo["der"]
    return nodo["p"]


def imprimir_arbol(nodo, sangria=""):
    if nodo["hoja"]:
        print("%s-> riesgo %.1f %%  (n=%d)" % (sangria, 100 * nodo["p"], nodo["n"]))
        return
    print("%s[%s <= %.4f]  (n=%d)" % (sangria, nodo["col"], nodo["val"], nodo["n"]))
    imprimir_arbol(nodo["izq"], sangria + "   si  ")
    imprimir_arbol(nodo["der"], sangria + "   no  ")


# ---------------------------------------------------------------------------

def main():
    filas = cargar()
    cols = columnas_numericas(filas)
    fechas = sorted(set(r["fecha_corte"] for r in filas))
    corte_split = fechas[int(len(fechas) * 0.7)]

    train = [r for r in filas if r["fecha_corte"] < corte_split]
    test = [r for r in filas if r["fecha_corte"] >= corte_split]

    print("=" * 68)
    print("VALIDACION DEL DATASET -- Futcademic / Mineria de Datos")
    print("=" * 68)
    print("Filas totales ............ %d" % len(filas))
    print("Alumnos distintos ........ %d" % len(set(r["student_id"] for r in filas)))
    print("Cortes temporales ........ %d  (%s a %s)"
          % (len(fechas), fechas[0], fechas[-1]))
    print("Particion TEMPORAL en .... %s" % corte_split)
    print("   entrenamiento ......... %d filas, %d bajas (%.1f %%)"
          % (len(train), sum(r["deserta_30d"] for r in train),
             100 * sum(r["deserta_30d"] for r in train) / len(train)))
    print("   prueba ................ %d filas, %d bajas (%.1f %%)"
          % (len(test), sum(r["deserta_30d"] for r in test),
             100 * sum(r["deserta_30d"] for r in test) / len(test)))

    # --- poder predictivo de cada variable por separado ---
    print()
    print("-" * 68)
    print("AUC individual de cada variable (sobre el conjunto completo)")
    print("-" * 68)
    y = [r["deserta_30d"] for r in filas]
    ranking = []
    for c in cols:
        a = auc([r[c] for r in filas], y)
        if a == a:                       # descarta NaN
            ranking.append((max(a, 1 - a), a, c))
    ranking.sort(reverse=True)
    for fuerza, a, c in ranking:
        sentido = "mas alto = mas riesgo" if a > 0.5 else "mas bajo = mas riesgo"
        barra = "#" * int(round((fuerza - 0.5) * 60))
        print("  %-24s AUC %.3f  %-22s %s" % (c, a, sentido, barra))

    # --- arbol de decision ---
    arbol = construir(train, cols)
    s_test = [predecir(arbol, r) for r in test]
    y_test = [r["deserta_30d"] for r in test]
    s_train = [predecir(arbol, r) for r in train]
    y_train = [r["deserta_30d"] for r in train]

    auc_test = auc(s_test, y_test)
    auc_train = auc(s_train, y_train)

    print()
    print("-" * 68)
    print("LINEA BASE: arbol de decision CART (Gini, profundidad %d)" % PROFUNDIDAD_MAX)
    print("-" * 68)
    imprimir_arbol(arbol)

    print()
    print("  AUC entrenamiento ...... %.3f" % auc_train)
    print("  AUC prueba ............. %.3f" % auc_test)
    print("  Sobreajuste (dif) ...... %.3f" % (auc_train - auc_test))

    # El umbral 0.5 es inutil con 7 % de positivos: se baja al percentil que
    # marca como riesgo al 15 % de los alumnos, que es lo que la academia
    # puede atender por telefono en una semana.
    orden = sorted(s_test, reverse=True)
    umbral = orden[max(0, int(len(orden) * 0.15) - 1)]
    m = metricas(s_test, y_test, umbral)
    print()
    print("  Con umbral %.3f (marca al 15 %% como 'en riesgo'):" % umbral)
    print("    precision ............ %.3f" % m["precision"])
    print("    recall ............... %.3f  <- metrica clave del objetivo O1"
          % m["recall"])
    print("    F1 ................... %.3f" % m["f1"])
    print("    matriz ............... VP=%d  FP=%d  FN=%d  VN=%d"
          % (m["vp"], m["fp"], m["fn"], m["vn"]))

    tasa_base = sum(y_test) / len(y_test)
    print()
    print("  Comparacion contra la regla trivial 'nadie deserta':")
    print("    tasa base de desercion  %.1f %%" % (100 * tasa_base))
    print("    lift del modelo ....... %.2fx"
          % (m["precision"] / tasa_base if tasa_base else 0))

    # --- veredicto ---
    print()
    print("=" * 68)
    if auc_test != auc_test:
        print("VEREDICTO: no se pudo evaluar (sin positivos en prueba).")
    elif auc_test < 0.65:
        print("VEREDICTO: SENAL DEBIL (AUC %.3f). El generador produce casi ruido;" % auc_test)
        print("           hay que reforzar la rampa previa a la baja.")
    elif auc_test > 0.97:
        print("VEREDICTO: DEMASIADO FACIL (AUC %.3f). Hay fuga de informacion;" % auc_test)
        print("           revisar que ninguna variable codifique la etiqueta.")
    else:
        print("VEREDICTO: DATASET VALIDO (AUC %.3f)." % auc_test)
        print("           Hay senal aprendible y margen para que un Random Forest")
        print("           o un boosting mejoren la linea base. Apto para el proyecto.")
    print("=" * 68)


if __name__ == "__main__":
    main()
