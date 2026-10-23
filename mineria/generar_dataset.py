#!/usr/bin/env python3
"""
Generador de dataset sintetico calibrado sobre el esquema y los datos reales
de Futcademic (Supabase / PostgreSQL, proyecto vbuoiysqzyntsharrowf).

Proyecto final de Mineria de Datos.

El sistema real lleva ~5.5 meses operando y solo acumula 28 registros de
asistencia y 7 de pago: insuficiente para entrenar un modelo supervisado.
Este script completa la malla asistencia = sesiones x alumnos de la categoria,
usando distribuciones calibradas sobre los patrones reales observados.

PARAMETROS CALIBRADOS CONTRA LA BASE REAL (corte 2026-10-21)
------------------------------------------------------------
  Tasa de presencia global ........ 82.1 %  (23 presentes / 28 asistencias)
  Dia de semana de las sesiones ... lunes 64, miercoles 48, martes 8,
                                    jueves 8, domingo 1  (n = 129 trainings)
  Edad de los alumnos ............. rango 4-18, moda 12   (n = 88 students)
  Edad de las bajas ............... rango 5-13, moda 12    (n = 33 deleted_students)
  Mensualidades observadas ........ 450, 450, 1200, 1200, 1300, 1500 MXN
  Cuotas por categoria ............ 320, 320, 350, 350, 400 MXN
  Poblacion del periodo ........... 88 alumnos activos + 33 bajas = 121
  Periodo ......................... 2026-05-07 a 2026-10-21

Lo que NO se inventa: el esquema, los nombres de escuela y categoria, la
estructura de llaves, el periodo y el tamano de la poblacion. Todo eso es real.
Lo que SI se simula: el detalle fila por fila de asistencia y pago.

Uso:
    python3 mineria/generar_dataset.py

Salida: mineria/dataset/*.csv  (solo biblioteca estandar, sin dependencias)
"""

import csv
import math
import os
import random
from datetime import date, timedelta

SEMILLA = 20261021          # reproducibilidad: mismo dataset en cada corrida
random.seed(SEMILLA)

AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(AQUI, "dataset")

INICIO = date(2026, 5, 7)   # primer registro real en la base
FIN = date(2026, 10, 21)    # fecha de corte

# ---------------------------------------------------------------------------
# 1. CATALOGOS REALES  (copiados tal cual de la base de produccion)
# ---------------------------------------------------------------------------

# (nombre_escuela, nombre_categoria, etiqueta_birth_year, edad_tipica, cuota_real)
# cuota_real = None  ->  la escuela no capturo monthly_fee; se imputa (ver NOTA 1)
CATALOGO = [
    ("Master Fut MR",       "Categoria 20/21",   "2020-2021",  5, None),
    ("Master Fut MR",       "Categoria 18/19",   "2018-2019",  7, None),
    ("Master Fut MR",       "Categoria 16/17",   "2016-2017",  9, None),
    ("Master Fut MR",       "Categoria 14/15",   "2014-2015", 11, None),
    ("Master Fut MR",       "Categoria 12/13",   "2012-2013", 13, None),
    ("Master Fut MR",       "Categoria 10/11 +", "2010-2011", 15, None),
    ("Alcones Rayados",     "SUB16",             "2016",       9, 350),
    ("Alcones Rayados",     "SUB-15",            "2015",      10, 400),
    ("Alcones Rayados",     "SUB14",             "2014",      11, 350),
    ("Alcones Rayados",     "Sub13",             "2013",      12, 320),
    ("Alcones Rayados",     "Sub14",             "2012",      13, 320),
    ("Gallos Verdes FC",    "Sub-13",            "2013",      12, None),
    ("Demo Test Academy 2", "Sub-2014-2015",     "2014-2015", 11, None),
    ("Academia Demo 2",     "Categoria sub 122", "2014",      11, None),
    # --- academias SIMULADAS (ver ESCUELAS_SINTETICAS) ---
    ("Gallos San Rafael",   "Sub-8",             "2018",       7, 400),
    ("Gallos San Rafael",   "Sub-10",            "2016",       9, 450),
    ("Gallos San Rafael",   "Sub-12",            "2014",      11, 500),
    ("Gallos San Rafael",   "Sub-14",            "2012",      13, 550),
    ("Gallos San Rafael",   "Sub-16",            "2010",      15, 600),
    ("Master Fut MR Aguascalientes", "Categoria 20/21", "2020-2021",  5, 450),
    ("Master Fut MR Aguascalientes", "Categoria 18/19", "2018-2019",  7, 500),
    ("Master Fut MR Aguascalientes", "Categoria 16/17", "2016-2017",  9, 550),
    ("Master Fut MR Aguascalientes", "Categoria 14/15", "2014-2015", 11, 600),
    ("Master Fut MR Aguascalientes", "Categoria 12/13", "2012-2013", 13, 650),
    ("Master Fut MR Aguascalientes", "Categoria 10/11", "2010-2011", 15, 700),
]

# Academias que NO existen en la base real. Se agregan unicamente para dar
# volumen al conjunto, y quedan marcadas como simuladas en categories.csv y
# students.csv (columna `origen`).
#
# NO son academias reales y no deben presentarse como tales. Las otras cinco
# reproducen escuelas que si existen en produccion, con su roster y su numero
# de bajas tomados de la base; estas dos son invencion del generador.
ESCUELAS_SINTETICAS = {"Gallos San Rafael", "Master Fut MR Aguascalientes"}

# Alumnos por categoria: proporcion real de `students`, escalada para cubrir
# tambien a los 33 alumnos dados de baja durante el periodo (88 + 33 = 121).
ALUMNOS_POR_CATEGORIA = {
    ("Master Fut MR",       "Categoria 20/21"):   14,
    ("Master Fut MR",       "Categoria 18/19"):   26,
    ("Master Fut MR",       "Categoria 16/17"):   15,
    ("Master Fut MR",       "Categoria 14/15"):   25,
    ("Master Fut MR",       "Categoria 12/13"):   14,
    ("Master Fut MR",       "Categoria 10/11 +"): 13,
    ("Alcones Rayados",     "SUB16"):              2,
    ("Alcones Rayados",     "SUB-15"):             2,
    ("Alcones Rayados",     "SUB14"):              2,
    ("Alcones Rayados",     "Sub13"):              2,
    ("Alcones Rayados",     "Sub14"):              1,
    ("Gallos Verdes FC",    "Sub-13"):             3,
    ("Demo Test Academy 2", "Sub-2014-2015"):      1,
    ("Academia Demo 2",     "Categoria sub 122"):  1,
    # --- academias simuladas ---
    ("Gallos San Rafael",   "Sub-8"):             12,
    ("Gallos San Rafael",   "Sub-10"):            14,
    ("Gallos San Rafael",   "Sub-12"):            13,
    ("Gallos San Rafael",   "Sub-14"):            11,
    ("Gallos San Rafael",   "Sub-16"):            10,
    ("Master Fut MR Aguascalientes", "Categoria 20/21"): 11,
    ("Master Fut MR Aguascalientes", "Categoria 18/19"): 14,
    ("Master Fut MR Aguascalientes", "Categoria 16/17"): 13,
    ("Master Fut MR Aguascalientes", "Categoria 14/15"): 15,
    ("Master Fut MR Aguascalientes", "Categoria 12/13"): 12,
    ("Master Fut MR Aguascalientes", "Categoria 10/11"): 10,
}
# 121 alumnos que reproducen la base real + 135 simulados = 256

# NOTA 1 — imputacion de cuota. Master Fut MR y las academias demo dejaron
# monthly_fee en 0 (no capturaron el dato), pero SI registraron pagos reales de
# 450 a 1500 MXN. Se imputa la cuota por grupo de edad dentro de ese rango real.
CUOTA_IMPUTADA = {5: 450, 7: 500, 9: 600, 10: 650, 11: 1200, 12: 1200, 13: 1300, 15: 1500}

# Perfiles latentes de comportamiento. No existen como columna en la base: son
# la estructura que el clustering del objetivo O3 deberia redescubrir.
#   p_base   = probabilidad base de asistir
#   p_pago   = probabilidad de pagar la mensualidad del mes
#   atraso   = dias promedio de atraso cuando si paga
#   p_baja   = probabilidad de darse de baja durante el periodo
# p_base esta calibrada hacia arriba a proposito: la estacionalidad, la rampa
# previa a la baja y los ajustes por tipo de sesion son multiplicadores < 1, asi
# que la tasa observada al final del pipeline queda ~11 puntos por debajo de la
# p_base ponderada. Con estos valores el resultado aterriza en el 82 % real.
PERFILES = {
    "comprometido": {"peso": 0.40, "p_base": 0.97, "p_pago": 0.97, "atraso":  2, "p_baja": 0.04},
    "intermitente": {"peso": 0.30, "p_base": 0.90, "p_pago": 0.88, "atraso":  7, "p_baja": 0.22},
    "moroso":       {"peso": 0.15, "p_base": 0.93, "p_pago": 0.55, "atraso": 18, "p_baja": 0.35},
    "en_fuga":      {"peso": 0.15, "p_base": 0.80, "p_pago": 0.60, "atraso": 14, "p_baja": 0.80},
}

# La base real registra 33 bajas entre sus 121 alumnos del periodo: 27.3 %. Para
# las academias simuladas se aplica esa misma tasa, de modo que el desbalance de
# la clase objetivo no cambie al agregarlas.
BAJAS_REALES = 33
TASA_BAJA_OBSERVADA = 33 / 121.0

# Estacionalidad mensual del futbol infantil en Mexico: julio y agosto caen por
# vacaciones escolares, septiembre y octubre se recuperan con el torneo.
ESTACIONALIDAD = {5: 1.00, 6: 0.97, 7: 0.80, 8: 0.85, 9: 1.00, 10: 0.98}

# Dias de entrenamiento: replica la distribucion real (lunes y miercoles
# dominan; martes y jueves son sesiones extra ocasionales).
# 0 = lunes ... 6 = domingo
DIAS_FIJOS = [0, 2]
DIA_EXTRA = 3
PROB_DIA_EXTRA = 0.12
PROB_PARTIDO_SABADO = 0.25

NOMBRES = [
    "Santiago", "Mateo", "Sebastian", "Leonardo", "Matias", "Emiliano", "Diego",
    "Miguel", "Alejandro", "Daniel", "Gabriel", "Samuel", "Angel", "Adrian",
    "David", "Jesus", "Luis", "Carlos", "Juan", "Jose", "Fernando", "Ricardo",
    "Eduardo", "Andres", "Pablo", "Rodrigo", "Ivan", "Hector", "Oscar", "Raul",
    "Valentina", "Regina", "Camila", "Renata", "Ximena", "Natalia", "Sofia",
    "Isabella", "Daniela", "Fernanda", "Mariana", "Paulina", "Andrea", "Jimena",
]
APELLIDOS = [
    "Hernandez", "Garcia", "Martinez", "Lopez", "Gonzalez", "Perez", "Rodriguez",
    "Sanchez", "Ramirez", "Cruz", "Flores", "Gomez", "Morales", "Vazquez",
    "Reyes", "Jimenez", "Torres", "Diaz", "Gutierrez", "Ruiz", "Mendoza",
    "Aguilar", "Ortiz", "Castillo", "Romero", "Alvarez", "Medina", "Vargas",
]

SEDES = [
    ("Unidad Deportiva Lopez Mateos", 20.6736, -103.3440),
    ("Cancha Las Aguilas",            20.6597, -103.3496),
    ("Campo Tlaquepaque",             20.6409, -103.3120),
    ("Deportivo Zapopan Norte",       20.7214, -103.3918),
    ("Cancha Municipal Tonala",       20.6243, -103.2340),
]


def uid(prefijo, n):
    """Identificador legible. La base real usa UUID; aqui se usa un id corto
    para que los CSV sean manejables en Weka y en una hoja de calculo."""
    return "%s-%04d" % (prefijo, n)


def dias_entre(inicio, fin):
    d = inicio
    while d <= fin:
        yield d
        d += timedelta(days=1)


# ---------------------------------------------------------------------------
# 2. GENERACION DE ENTIDADES
# ---------------------------------------------------------------------------

def generar_escuelas():
    escuelas = {}
    for i, nombre in enumerate(dict.fromkeys(e for e, _, _, _, _ in CATALOGO), start=1):
        escuelas[nombre] = {
            "school_id": uid("SCH", i),
            "name": nombre,
            "origen": "simulada" if nombre in ESCUELAS_SINTETICAS else "espejo_real",
        }
    return escuelas


def generar_categorias(escuelas):
    categorias = []
    for i, (escuela, cat, by, edad, cuota) in enumerate(CATALOGO, start=1):
        categorias.append({
            "category_id": uid("CAT", i),
            "school_id": escuelas[escuela]["school_id"],
            "school_name": escuela,
            "name": cat,
            "birth_year": by,
            "edad_tipica": edad,
            "monthly_fee": cuota if cuota is not None else CUOTA_IMPUTADA[edad],
            "cuota_imputada": cuota is None,
            "origen": "simulada" if escuela in ESCUELAS_SINTETICAS else "espejo_real",
        })
    return categorias


def generar_sedes(escuelas):
    venues = []
    for i, (nombre, lat, lon) in enumerate(SEDES, start=1):
        escuela = list(escuelas.values())[i % len(escuelas)]
        venues.append({
            "venue_id": uid("VEN", i),
            "school_id": escuela["school_id"],
            "name": nombre,
            "latitud": lat,
            "longitud": lon,
        })
    return venues


def elegir_perfil():
    r = random.random()
    acum = 0.0
    for nombre, cfg in PERFILES.items():
        acum += cfg["peso"]
        if r <= acum:
            return nombre
    return "comprometido"


def generar_alumnos(categorias):
    """121 alumnos: 88 que siguen activos al corte + 33 que causaron baja."""
    alumnos = []
    n = 0
    usados = set()
    for cat in categorias:
        clave = (cat["school_name"], cat["name"])
        for _ in range(ALUMNOS_POR_CATEGORIA[clave]):
            n += 1
            # nombre unico
            while True:
                nombre = "%s %s %s" % (
                    random.choice(NOMBRES), random.choice(APELLIDOS), random.choice(APELLIDOS))
                if nombre not in usados:
                    usados.add(nombre)
                    break

            # edad: la tipica de la categoria con dispersion de +-1 ano,
            # igual que en la base real (las categorias cubren 2 anos)
            edad = cat["edad_tipica"] + random.choice([-1, 0, 0, 1])
            edad = max(4, min(18, edad))
            nacimiento = date(2026 - edad, random.randint(1, 12), random.randint(1, 28))

            perfil = elegir_perfil()
            cfg = PERFILES[perfil]

            # Fecha de alta: el 70 % venia desde el arranque del sistema,
            # el resto se inscribio durante el periodo.
            if random.random() < 0.70:
                alta = INICIO + timedelta(days=random.randint(0, 20))
            else:
                alta = INICIO + timedelta(days=random.randint(21, 140))

            # Propension individual de asistencia: ruido alrededor del perfil.
            p_individual = min(0.99, max(0.25, random.gauss(cfg["p_base"], 0.07)))

            alumnos.append({
                "student_id": uid("STU", n),
                "school_id": cat["school_id"],
                "school_name": cat["school_name"],
                "category_id": cat["category_id"],
                "category_name": cat["name"],
                "origen": cat["origen"],
                "full_name": nombre,
                "birth_date": nacimiento,
                "edad": edad,
                "fecha_alta": alta,
                "fecha_baja": None,           # se asigna en asignar_bajas()
                "status": random.choices(
                    ["activo", "beca", "pendiente"], weights=[0.90, 0.06, 0.04])[0],
                "uniform_delivered": random.random() < 0.78,
                "perfil_latente": perfil,     # verdad oculta: NO usar como feature
                "p_individual": p_individual,
                "p_pago": min(0.99, max(0.20, random.gauss(cfg["p_pago"], 0.08))),
                "atraso_medio": cfg["atraso"],
                "propension_baja": cfg["p_baja"],
                "current_streak": 0,
                "max_streak": 0,
                "last_attendance_date": None,
            })
    asignar_bajas(alumnos)
    return alumnos


def asignar_bajas(alumnos):
    """Marca como dados de baja a un numero fijo de alumnos por grupo.

    Los que reproducen la base real reciben exactamente sus 33 bajas; los de las
    academias simuladas reciben la misma tasa (27.3 %), para que el desbalance de
    la clase objetivo sea el mismo en los dos grupos.
    """
    espejo = [a for a in alumnos if a["origen"] == "espejo_real"]
    simulados = [a for a in alumnos if a["origen"] == "simulada"]
    _marcar(espejo, BAJAS_REALES)
    _marcar(simulados, int(round(len(simulados) * TASA_BAJA_OBSERVADA)))


def _marcar(grupo, objetivo):
    """Muestreo sin reemplazo ponderado por la propension del perfil.

    El alumno 'en_fuga' tiene 20 veces mas probabilidad de salir que el
    'comprometido', pero ninguno de los dos esta predeterminado: asi el total
    cuadra sin volver trivial la clasificacion.
    """
    elegibles = [a for a in grupo if a["fecha_alta"] + timedelta(days=30) < FIN]
    pesos = [a["propension_baja"] for a in elegibles]

    seleccionados = []
    for _ in range(min(objetivo, len(elegibles))):
        total = sum(pesos)
        if total <= 0:
            break
        r = random.uniform(0, total)
        acum = 0.0
        for i, w in enumerate(pesos):
            acum += w
            if r <= acum:
                seleccionados.append(elegibles[i])
                pesos[i] = 0.0      # sin reemplazo
                break

    for a in seleccionados:
        mas_pronto = a["fecha_alta"] + timedelta(days=30)
        a["fecha_baja"] = mas_pronto + timedelta(
            days=random.randint(0, (FIN - mas_pronto).days))
        a["status"] = "inactivo"


def generar_sesiones(categorias, venues):
    """Una sesion por categoria en cada dia de entrenamiento del periodo."""
    sesiones = []
    n = 0
    for cat in categorias:
        sede = random.choice([v for v in venues if v["school_id"] == cat["school_id"]]
                             or venues)
        hora_base = random.choice(["16:00", "17:00", "18:00", "19:00"])
        for d in dias_entre(INICIO, FIN):
            dow = d.weekday()
            tipo = None
            if dow in DIAS_FIJOS:
                tipo = "entrenamiento"
            elif dow == DIA_EXTRA and random.random() < PROB_DIA_EXTRA:
                tipo = "entrenamiento"
            elif dow == 5 and random.random() < PROB_PARTIDO_SABADO:
                tipo = "partido"
            if tipo is None:
                continue

            # Las sesiones se cancelan ocasionalmente (lluvia, sede ocupada).
            cancelada = random.random() < 0.05
            n += 1
            sesiones.append({
                "training_id": uid("TRN", n),
                "school_id": cat["school_id"],
                "category_id": cat["category_id"],
                "venue_id": sede["venue_id"],
                "date": d,
                "start_time": hora_base if tipo == "entrenamiento" else "09:00",
                "type": tipo,
                "is_cancelled": cancelada,
                "is_completed": (not cancelada) and d <= FIN,
            })
    return sesiones


def factor_deterioro(alumno, fecha):
    """Rampa descendente de asistencia en los 45 dias previos a la baja.

    Es el patron que hace aprendible el objetivo O1: el alumno no desaparece
    de golpe, se va despegando. Sin esta rampa la desercion seria ruido puro.
    """
    if not alumno["fecha_baja"]:
        return 1.0
    faltan = (alumno["fecha_baja"] - fecha).days
    if faltan < 0:
        return 0.0
    if faltan >= 45:
        return 1.0
    return 0.35 + 0.65 * (faltan / 45.0)


def generar_asistencias(alumnos, sesiones):
    """Malla completa sesion x alumno de la categoria, dentro de su vigencia."""
    por_categoria = {}
    for a in alumnos:
        por_categoria.setdefault(a["category_id"], []).append(a)

    asistencias = []
    n = 0
    for s in sorted(sesiones, key=lambda x: x["date"]):
        if s["is_cancelled"]:
            continue
        for a in por_categoria.get(s["category_id"], []):
            # el alumno solo cuenta entre su alta y su baja
            if s["date"] < a["fecha_alta"]:
                continue
            if a["fecha_baja"] and s["date"] >= a["fecha_baja"]:
                continue

            p = a["p_individual"]
            p *= ESTACIONALIDAD.get(s["date"].month, 1.0)
            p *= factor_deterioro(a, s["date"])
            if s["type"] == "partido":
                p *= 1.06          # a los partidos se falta menos
            if s["date"].weekday() == DIA_EXTRA:
                p *= 0.92          # la sesion extra entre semana pesa mas
            p = min(0.995, max(0.02, p))

            presente = random.random() < p

            # racha: se reinicia con cada falta (misma logica que la app real)
            if presente:
                a["current_streak"] += 1
                a["max_streak"] = max(a["max_streak"], a["current_streak"])
                a["last_attendance_date"] = s["date"]
            else:
                a["current_streak"] = 0

            n += 1
            asistencias.append({
                "attendance_id": uid("ATT", n),
                "school_id": s["school_id"],
                "student_id": a["student_id"],
                "category_id": s["category_id"],
                "training_id": s["training_id"],
                "date": s["date"],
                "type": s["type"],
                "present": presente,
            })
    return asistencias


def generar_pagos(alumnos, categorias):
    """Una mensualidad esperada por alumno y por mes de vigencia."""
    cuota = {c["category_id"]: c["monthly_fee"] for c in categorias}
    pagos = []
    esperados = []
    n = 0
    for a in alumnos:
        for mes in range(5, 11):
            primero = date(2026, mes, 1)
            ultimo = date(2026, mes, 28)
            # el mes cuenta si el alumno estuvo vigente en el
            if ultimo < a["fecha_alta"]:
                continue
            if a["fecha_baja"] and primero >= a["fecha_baja"]:
                continue

            monto = cuota[a["category_id"]]
            if a["status"] == "beca":
                monto = round(monto * 0.5)

            p = a["p_pago"]
            # quien ya va de salida deja de pagar
            if a["fecha_baja"]:
                faltan = (a["fecha_baja"] - primero).days
                if faltan < 60:
                    p *= 0.45
            pagado = random.random() < p

            esperados.append({
                "student_id": a["student_id"],
                "payment_month": mes,
                "payment_year": 2026,
                "monto_esperado": monto,
                "pagado": pagado,
            })

            if pagado:
                atraso = max(0, int(random.gauss(a["atraso_medio"], 5)))
                fecha_pago = primero + timedelta(days=min(27, 4 + atraso))
                # El mes cuenta si el alumno estuvo vigente en cualquier momento
                # de el, pero la fecha concreta del cobro tiene que caer dentro
                # de su vigencia: un pago fechado antes del alta o despues de la
                # baja es incoherente y rompe cualquier analisis de cobranza.
                if fecha_pago < a["fecha_alta"]:
                    fecha_pago = a["fecha_alta"]
                if a["fecha_baja"] and fecha_pago >= a["fecha_baja"]:
                    continue        # se fue antes de alcanzar a pagar ese mes
                if fecha_pago > FIN:
                    continue
                n += 1
                pagos.append({
                    "payment_id": uid("PAY", n),
                    "school_id": a["school_id"],
                    "student_id": a["student_id"],
                    "amount": monto,
                    "payment_date": fecha_pago,
                    "payment_type": "mensualidad",
                    "payment_month": mes,
                    "payment_year": 2026,
                    "dias_atraso": atraso,
                })
    return pagos, esperados


# ---------------------------------------------------------------------------
# 3. TABLA ANALITICA (la que se lleva a Weka / scikit-learn)
# ---------------------------------------------------------------------------

def construir_tabla_ml(alumnos, asistencias, esperados):
    """Panel alumno x fecha de corte, con la etiqueta 'se da de baja en 30 dias'.

    Se toma una foto cada 10 dias. Cada fila resume el comportamiento del alumno
    hasta esa fecha; la etiqueta mira 30 dias hacia adelante. El alumno sale del
    panel en cuanto causa baja (no se predice a quien ya se fue).

    ADVERTENCIA METODOLOGICA: un mismo alumno aporta varias filas, y esas filas
    estan correlacionadas entre si. Partir el dataset al azar mete al mismo
    alumno en entrenamiento y en prueba, lo que infla las metricas. Hay que
    partir POR ALUMNO (GroupKFold / GroupShuffleSplit con groups=student_id) o,
    mejor aun, por tiempo: entrenar con los cortes viejos y probar con los
    recientes.
    """
    por_alumno = {}
    for r in asistencias:
        por_alumno.setdefault(r["student_id"], []).append(r)
    for v in por_alumno.values():
        v.sort(key=lambda x: x["date"])

    pagos_alumno = {}
    for e in esperados:
        pagos_alumno.setdefault(e["student_id"], []).append(e)

    cortes = []
    d = INICIO + timedelta(days=39)       # primer corte con 30+ dias de historia
    while d <= FIN - timedelta(days=30):  # ultimo corte con ventana completa
        cortes.append(d)
        d += timedelta(days=10)

    filas = []
    for a in alumnos:
        regs = por_alumno.get(a["student_id"], [])
        for corte in cortes:
            if corte < a["fecha_alta"] + timedelta(days=30):
                continue
            if a["fecha_baja"] and corte >= a["fecha_baja"]:
                continue

            v30 = [r for r in regs if corte - timedelta(days=30) <= r["date"] <= corte]
            v60 = [r for r in regs if corte - timedelta(days=60) <= r["date"] <= corte]
            v15 = [r for r in regs if corte - timedelta(days=15) <= r["date"] <= corte]
            previos = [r for r in regs if r["date"] <= corte]
            if len(v30) < 2:
                continue   # sin historia suficiente para describir al alumno

            tasa30 = sum(1 for r in v30 if r["present"]) / len(v30)
            tasa60 = sum(1 for r in v60 if r["present"]) / len(v60) if v60 else tasa30
            tasa15 = sum(1 for r in v15 if r["present"]) / len(v15) if v15 else tasa30

            ultima = max((r["date"] for r in previos if r["present"]), default=None)
            dias_sin_asistir = (corte - ultima).days if ultima else 999

            # racha vigente al corte
            racha, maxima, actual = 0, 0, 0
            for r in previos:
                if r["present"]:
                    actual += 1
                    maxima = max(maxima, actual)
                else:
                    actual = 0
            racha = actual

            meses_vencidos = sum(
                1 for e in pagos_alumno.get(a["student_id"], [])
                if not e["pagado"] and date(e["payment_year"], e["payment_month"], 28) <= corte)
            meses_evaluados = sum(
                1 for e in pagos_alumno.get(a["student_id"], [])
                if date(e["payment_year"], e["payment_month"], 28) <= corte)
            cumplimiento = ((meses_evaluados - meses_vencidos) / meses_evaluados
                            if meses_evaluados else 1.0)

            desert = (a["fecha_baja"] is not None
                      and corte < a["fecha_baja"] <= corte + timedelta(days=30))

            filas.append({
                "student_id": a["student_id"],
                "fecha_corte": corte,
                "origen": a["origen"],
                "escuela": a["school_name"],
                "categoria": a["category_name"],
                "edad": a["edad"],
                "status": a["status"],
                "uniforme_entregado": int(a["uniform_delivered"]),
                "antiguedad_dias": (corte - a["fecha_alta"]).days,
                "sesiones_30d": len(v30),
                "tasa_asistencia_15d": round(tasa15, 4),
                "tasa_asistencia_30d": round(tasa30, 4),
                "tasa_asistencia_60d": round(tasa60, 4),
                "tendencia_asistencia": round(tasa15 - tasa60, 4),
                "dias_sin_asistir": dias_sin_asistir,
                "racha_actual": racha,
                "racha_maxima": maxima,
                "ratio_racha": round(racha / maxima, 4) if maxima else 0.0,
                "meses_vencidos": meses_vencidos,
                "cumplimiento_pago": round(cumplimiento, 4),
                "perfil_latente": a["perfil_latente"],   # NO usar como predictor
                "deserta_30d": int(desert),
            })
    return filas


# ---------------------------------------------------------------------------
# 4. ESCRITURA
# ---------------------------------------------------------------------------

def escribir(nombre, filas, columnas):
    ruta = os.path.join(SALIDA, nombre)
    with open(ruta, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=columnas, extrasaction="ignore")
        w.writeheader()
        for r in filas:
            w.writerow({c: r.get(c, "") for c in columnas})
    return ruta, len(filas)


def main():
    os.makedirs(SALIDA, exist_ok=True)

    escuelas = generar_escuelas()
    categorias = generar_categorias(escuelas)
    venues = generar_sedes(escuelas)
    alumnos = generar_alumnos(categorias)
    sesiones = generar_sesiones(categorias, venues)
    asistencias = generar_asistencias(alumnos, sesiones)
    pagos, esperados = generar_pagos(alumnos, categorias)
    tabla_ml = construir_tabla_ml(alumnos, asistencias, esperados)

    bajas = [{
        "deleted_student_id": uid("DEL", i),
        "school_id": a["school_id"],
        "original_student_id": a["student_id"],
        "full_name": a["full_name"],
        "birth_date": a["birth_date"],
        "category_id": a["category_id"],
        "deleted_at": a["fecha_baja"],
    } for i, a in enumerate((x for x in alumnos if x["fecha_baja"]), start=1)]

    escribir("schools.csv", list(escuelas.values()), ["school_id", "name", "origen"])
    escribir("categories.csv", categorias,
             ["category_id", "school_id", "school_name", "name", "birth_year",
              "monthly_fee", "cuota_imputada", "origen"])
    escribir("venues.csv", venues, ["venue_id", "school_id", "name", "latitud", "longitud"])
    escribir("students.csv", alumnos,
             ["student_id", "school_id", "school_name", "category_id", "category_name",
              "full_name", "birth_date", "edad", "fecha_alta", "fecha_baja", "status",
              "uniform_delivered", "current_streak", "max_streak", "last_attendance_date",
              "perfil_latente", "origen"])
    escribir("deleted_students.csv", bajas,
             ["deleted_student_id", "school_id", "original_student_id", "full_name",
              "birth_date", "category_id", "deleted_at"])
    escribir("trainings.csv", sesiones,
             ["training_id", "school_id", "category_id", "venue_id", "date",
              "start_time", "type", "is_cancelled", "is_completed"])
    escribir("attendances.csv", asistencias,
             ["attendance_id", "school_id", "student_id", "category_id", "training_id",
              "date", "type", "present"])
    escribir("payments.csv", pagos,
             ["payment_id", "school_id", "student_id", "amount", "payment_date",
              "payment_type", "payment_month", "payment_year", "dias_atraso"])
    escribir("dataset_ml.csv", tabla_ml,
             ["student_id", "fecha_corte", "origen", "escuela", "categoria", "edad", "status",
              "uniforme_entregado", "antiguedad_dias", "sesiones_30d",
              "tasa_asistencia_15d", "tasa_asistencia_30d", "tasa_asistencia_60d",
              "tendencia_asistencia", "dias_sin_asistir", "racha_actual",
              "racha_maxima", "ratio_racha", "meses_vencidos", "cumplimiento_pago",
              "perfil_latente", "deserta_30d"])

    # ---- reporte en consola ----
    presentes = sum(1 for r in asistencias if r["present"])
    positivos = sum(r["deserta_30d"] for r in tabla_ml)
    cobrado = sum(p["amount"] for p in pagos)
    esperado = sum(e["monto_esperado"] for e in esperados)

    print("Dataset generado en: %s" % SALIDA)
    print("  semilla ................. %d" % SEMILLA)
    print("  periodo ................. %s a %s" % (INICIO, FIN))
    print()
    espejo = [a for a in alumnos if a["origen"] == "espejo_real"]
    simulados = [a for a in alumnos if a["origen"] == "simulada"]

    print("  escuelas ................ %d  (%d reproducen la base, %d simuladas)"
          % (len(escuelas), len(escuelas) - len(ESCUELAS_SINTETICAS),
             len(ESCUELAS_SINTETICAS)))
    print("  categorias .............. %d" % len(categorias))
    print("  alumnos ................. %d  (%d bajas)" % (len(alumnos), len(bajas)))
    print("     espejo de la base .... %d  (%d bajas)"
          % (len(espejo), sum(1 for a in espejo if a["fecha_baja"])))
    print("     simulados ............ %d  (%d bajas)"
          % (len(simulados), sum(1 for a in simulados if a["fecha_baja"])))
    print("  sesiones ................ %d  (%d canceladas)"
          % (len(sesiones), sum(1 for s in sesiones if s["is_cancelled"])))
    print("  asistencias ............. %d" % len(asistencias))
    print("     tasa de presencia .... %.1f %%  (real: 82.1 %%)"
          % (100.0 * presentes / len(asistencias)))
    print("  pagos ................... %d de %d mensualidades esperadas"
          % (len(pagos), len(esperados)))
    print("     cobranza ............. %.1f %%  ($%s de $%s MXN)"
          % (100.0 * cobrado / esperado, format(cobrado, ","), format(esperado, ",")))
    print()
    print("  dataset_ml.csv .......... %d filas, %d columnas" % (len(tabla_ml), 21))
    print("     positivos (baja 30d) . %d  (%.1f %% -- clase minoritaria)"
          % (positivos, 100.0 * positivos / len(tabla_ml)))
    print()
    print("  Recordatorio: 'perfil_latente' es la verdad oculta del generador.")
    print("  Usarla como predictor invalida el experimento; sirve solo para")
    print("  validar el clustering del objetivo O3.")
    print()
    print("  AVISO: %s" % " y ".join(sorted(ESCUELAS_SINTETICAS)))
    print("  no existen en la base real. Van marcadas con origen='simulada' en")
    print("  schools.csv, categories.csv, students.csv y dataset_ml.csv.")
    print("  No las presentes como academias reales.")


if __name__ == "__main__":
    main()
