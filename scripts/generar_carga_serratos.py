#!/usr/bin/env python3
"""
Genera scripts/carga/NN_<hoja>.sql: una transaccion por hoja que carga
serratos_data_filtrado.json en la escuela existente 'Gallos San Rafael Serratos'.
No ejecuta nada por si sola.

Idempotente (NOT EXISTS en cada insert) y sin borrados: se puede reejecutar.

Filtros de calidad (ademas de excluir a quien no trae fecha de nacimiento):
  * fecha de nacimiento fuera de 2005-2024  -> no se carga (la hoja trae 2821, 1905, 2002...)
  * pagos repetidos del mismo mes en un alumno -> se conserva el primero
Todo lo que se descarta queda en scripts/serratos_descartes_calidad.txt
"""
import json
import os
import re
from collections import Counter

AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(AQUI, "carga")
S = "cc9e9884-a889-4157-8b73-5a2a75cd1733"   # school_id
V = "7ded02f7-e14e-4f1f-8f99-8b08a68be35d"   # sede existente
os.makedirs(SALIDA, exist_ok=True)
for f in os.listdir(SALIDA):
    os.remove(os.path.join(SALIDA, f))

d = json.load(open(os.path.join(AQUI, "serratos_data_filtrado.json")))
descartes = []
CAT = "(select id from categories where school_id='%s' and name=a->>'c')" % S
STU = ("(select id from students s0 where s0.school_id='%s' and s0.full_name=a->>'n' "
       "and s0.birth_date=(a->>'b')::date limit 1)") % S

totales = Counter()
for i, h in enumerate(d["hojas"], start=1):
    m = [p["monto"] for a in h["alumnos"] for p in a["pagos"] if p["tipo"] == "mensualidad"]
    cuota = Counter(m).most_common(1)[0][0] if m else 0
    # categories tiene UNIQUE(school_id, birth_year): las hojas A y B de un mismo año
    # comparten categoria. TM ya existe como 'Turno matutino'.
    if h["hoja"] == "TM":
        nombre, by = "Turno matutino", "2012"
    elif h["hoja"] == "PORTEROS":
        nombre, by = "PORTEROS", "Porteros"
    elif h["hoja"].startswith("FEMENIL"):
        nombre, by = "FEMENIL 14-15", "2014-2015 Femenil"
    else:
        nombre, by = re.sub(r"\s+[AB]$", "", h["hoja"]), h["anio_categoria"]
    cats = [] if h["hoja"] == "TM" else [[nombre, by, cuota]]

    alum = []
    for a in h["alumnos"]:
        anio = int(a["fecha_nac"][:4])
        if not 2005 <= anio <= 2024:
            descartes.append("%-14s %-40s fecha de nacimiento imposible: %s" % (h["hoja"], a["nombre"], a["fecha_nac"]))
            continue
        vistos, pagos = set(), []
        for p in a["pagos"]:
            k = p["mes"] or 0
            if k in vistos:
                descartes.append("%-14s %-40s pago repetido mes=%s monto=%s (se conserva el primero)" % (h["hoja"], a["nombre"], k, p["monto"]))
                continue
            vistos.add(k)
            pagos.append([k, p["monto"]])
        alum.append({"c": nombre, "n": a["nombre"], "b": a["fecha_nac"],
                     "a": [[x["fecha"][5:], 1 if x["present"] else 0] for x in a["asistencias"]],
                     "p": pagos})
    totales["alumnos"] += len(alum)

    payload = json.dumps({"cats": cats, "al": alum}, ensure_ascii=False, separators=(",", ":"))
    sql = f"""begin;
create temp table _imp on commit drop as select $j${payload}$j$::jsonb as d;

-- la primera corrida creo '20-21 A'; ahora A y B comparten la categoria '20-21'
update categories set name='20-21' where school_id='{S}' and name='20-21 A';

insert into categories(school_id,name,birth_year,monthly_fee)
select '{S}', c->>0, c->>1, (c->>2)::numeric from _imp, jsonb_array_elements(d->'cats') c
where not exists (select 1 from categories x where x.school_id='{S}' and (x.name=c->>0 or x.birth_year=c->>1));

insert into students(school_id,category_id,full_name,birth_date,status)
select '{S}', {CAT}, a->>'n', (a->>'b')::date, 'activo'
from _imp, jsonb_array_elements(d->'al') a
where not exists (select 1 from students s where s.school_id='{S}' and s.full_name=a->>'n' and s.birth_date=(a->>'b')::date);

insert into trainings(school_id,category_id,venue_id,date,type,is_completed,is_cancelled)
select distinct '{S}'::uuid, {CAT}, '{V}'::uuid, ('2026-'||(x->>0))::date, 'entrenamiento', true, false
from _imp, jsonb_array_elements(d->'al') a, jsonb_array_elements(a->'a') x
where not exists (select 1 from trainings t where t.school_id='{S}' and t.category_id={CAT} and t.date=('2026-'||(x->>0))::date);

insert into attendances(school_id,student_id,category_id,training_id,date,type,present)
select distinct on (s.id, t.date) '{S}'::uuid, s.id, s.category_id, t.id, t.date, 'entrenamiento', (x->>1)::int=1
from _imp, jsonb_array_elements(d->'al') a, jsonb_array_elements(a->'a') x
join lateral (select id, category_id from students where id={STU}) s on true
join lateral (select id, date from trainings t0 where t0.school_id='{S}' and t0.category_id=s.category_id and t0.date=('2026-'||(x->>0))::date limit 1) t on true
where not exists (select 1 from attendances z where z.student_id=s.id and z.date=t.date and z.type='entrenamiento')
order by s.id, t.date;

insert into payments(school_id,student_id,amount,payment_date,payment_type,payment_month,payment_year,description)
select '{S}', s.id, (p->>1)::numeric,
  case when (p->>0)::int=0 then date '2026-08-01' else make_date(2026,(p->>0)::int,1) end,
  'mensualidad', nullif((p->>0)::int,0), 2026,
  'Importado de lista Serratos (fecha estimada)' || case when (p->>0)::int=0 then ' - Liga' else '' end
from _imp, jsonb_array_elements(d->'al') a, jsonb_array_elements(a->'p') p
join lateral (select id from students where id={STU}) s on true
where not exists (select 1 from payments y where y.student_id=s.id and y.payment_year=2026
  and y.payment_month is not distinct from nullif((p->>0)::int,0) and y.description like 'Importado de lista Serratos%');
commit;
"""
    seguro = re.sub(r"[^A-Za-z0-9]+", "_", h["hoja"]).strip("_")
    open(os.path.join(SALIDA, "%02d_%s.sql" % (i, seguro)), "w").write(sql)
    print("%02d_%-14s %5d bytes  alumnos=%d" % (i, seguro, len(sql), len(alum)))

with open(os.path.join(AQUI, "serratos_descartes_calidad.txt"), "w") as f:
    f.write("Descartes por calidad de datos: %d\n\n" % len(descartes))
    f.write("\n".join(descartes) + "\n")
print("\nalumnos a cargar: %d | descartes por calidad: %d" % (totales["alumnos"], len(descartes)))
