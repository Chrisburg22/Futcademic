# Conjunto sintético (Modelo B: deserción a 30 días)

Generado por `generar_dataset.py`. Nombres inventados. Columna `origen`: `espejo_real` o `simulada`. Por tamaño se muestra el esquema, el número de filas y las primeras 15 filas de cada tabla.

## `attendances.csv` — 10259 filas

Columnas: `attendance_id`, `school_id`, `student_id`, `category_id`, `training_id`, `date`, `type`, `present`

| attendance_id | school_id | student_id | category_id | training_id | date | type | present |
|---|---|---|---|---|---|---|---|
| ATT-0001 | SCH-0001 | STU-0033 | CAT-0002 | TRN-0058 | 2026-05-09 | partido | True |
| ATT-0002 | SCH-0001 | STU-0088 | CAT-0005 | TRN-0229 | 2026-05-09 | partido | True |
| ATT-0003 | SCH-0001 | STU-0009 | CAT-0001 | TRN-0001 | 2026-05-11 | entrenamiento | True |
| ATT-0004 | SCH-0001 | STU-0010 | CAT-0001 | TRN-0001 | 2026-05-11 | entrenamiento | True |
| ATT-0005 | SCH-0001 | STU-0033 | CAT-0002 | TRN-0059 | 2026-05-11 | entrenamiento | True |
| ATT-0006 | SCH-0001 | STU-0042 | CAT-0003 | TRN-0115 | 2026-05-11 | entrenamiento | True |
| ATT-0007 | SCH-0001 | STU-0044 | CAT-0003 | TRN-0115 | 2026-05-11 | entrenamiento | True |
| ATT-0008 | SCH-0001 | STU-0046 | CAT-0003 | TRN-0115 | 2026-05-11 | entrenamiento | True |
| ATT-0009 | SCH-0001 | STU-0056 | CAT-0004 | TRN-0173 | 2026-05-11 | entrenamiento | True |
| ATT-0010 | SCH-0001 | STU-0057 | CAT-0004 | TRN-0173 | 2026-05-11 | entrenamiento | True |
| ATT-0011 | SCH-0001 | STU-0069 | CAT-0004 | TRN-0173 | 2026-05-11 | entrenamiento | True |
| ATT-0012 | SCH-0001 | STU-0070 | CAT-0004 | TRN-0173 | 2026-05-11 | entrenamiento | True |
| ATT-0013 | SCH-0001 | STU-0077 | CAT-0004 | TRN-0173 | 2026-05-11 | entrenamiento | True |
| ATT-0014 | SCH-0001 | STU-0088 | CAT-0005 | TRN-0230 | 2026-05-11 | entrenamiento | True |
| ATT-0015 | SCH-0002 | STU-0108 | CAT-0007 | TRN-0341 | 2026-05-11 | entrenamiento | True |

## `categories.csv` — 25 filas

Columnas: `category_id`, `school_id`, `school_name`, `name`, `birth_year`, `monthly_fee`, `cuota_imputada`, `origen`

| category_id | school_id | school_name | name | birth_year | monthly_fee | cuota_imputada | origen |
|---|---|---|---|---|---|---|---|
| CAT-0001 | SCH-0001 | Master Fut MR | Categoria 20/21 | 2020-2021 | 450 | True | espejo_real |
| CAT-0002 | SCH-0001 | Master Fut MR | Categoria 18/19 | 2018-2019 | 500 | True | espejo_real |
| CAT-0003 | SCH-0001 | Master Fut MR | Categoria 16/17 | 2016-2017 | 600 | True | espejo_real |
| CAT-0004 | SCH-0001 | Master Fut MR | Categoria 14/15 | 2014-2015 | 1200 | True | espejo_real |
| CAT-0005 | SCH-0001 | Master Fut MR | Categoria 12/13 | 2012-2013 | 1300 | True | espejo_real |
| CAT-0006 | SCH-0001 | Master Fut MR | Categoria 10/11 + | 2010-2011 | 1500 | True | espejo_real |
| CAT-0007 | SCH-0002 | Alcones Rayados | SUB16 | 2016 | 350 | False | espejo_real |
| CAT-0008 | SCH-0002 | Alcones Rayados | SUB-15 | 2015 | 400 | False | espejo_real |
| CAT-0009 | SCH-0002 | Alcones Rayados | SUB14 | 2014 | 350 | False | espejo_real |
| CAT-0010 | SCH-0002 | Alcones Rayados | Sub13 | 2013 | 320 | False | espejo_real |
| CAT-0011 | SCH-0002 | Alcones Rayados | Sub14 | 2012 | 320 | False | espejo_real |
| CAT-0012 | SCH-0003 | Gallos Verdes FC | Sub-13 | 2013 | 1200 | True | espejo_real |
| CAT-0013 | SCH-0004 | Demo Test Academy 2 | Sub-2014-2015 | 2014-2015 | 1200 | True | espejo_real |
| CAT-0014 | SCH-0005 | Academia Demo 2 | Categoria sub 122 | 2014 | 1200 | True | espejo_real |
| CAT-0015 | SCH-0006 | Gallos San Rafael | Sub-8 | 2018 | 400 | False | simulada |

## `dataset_ml.csv` — 1731 filas

Columnas: `student_id`, `fecha_corte`, `origen`, `escuela`, `categoria`, `edad`, `status`, `uniforme_entregado`, `antiguedad_dias`, `sesiones_30d`, `tasa_asistencia_15d`, `tasa_asistencia_30d`, `tasa_asistencia_60d`, `tendencia_asistencia`, `dias_sin_asistir`, `racha_actual`, `racha_maxima`, `ratio_racha`, `meses_vencidos`, `cumplimiento_pago`, `perfil_latente`, `deserta_30d`

| student_id | fecha_corte | origen | escuela | categoria | edad | status | uniforme_entregado | antiguedad_dias | sesiones_30d | tasa_asistencia_15d | tasa_asistencia_30d | tasa_asistencia_60d | tendencia_asistencia | dias_sin_asistir | racha_actual | racha_maxima | ratio_racha | meses_vencidos | cumplimiento_pago | perfil_latente | deserta_30d |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| STU-0001 | 2026-06-25 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 1 | 34 | 11 | 0.8333 | 0.8182 | 0.8333 | 0.0 | 0 | 4 | 4 | 1.0 | 0 | 1.0 | comprometido | 0 |
| STU-0001 | 2026-07-05 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 1 | 44 | 10 | 1.0 | 0.9 | 0.8667 | 0.1333 | 1 | 7 | 7 | 1.0 | 0 | 1.0 | comprometido | 0 |
| STU-0001 | 2026-07-15 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 1 | 54 | 13 | 0.6667 | 0.7692 | 0.7895 | -0.1228 | 2 | 0 | 7 | 0.0 | 0 | 1.0 | comprometido | 0 |
| STU-0001 | 2026-07-25 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 1 | 64 | 11 | 0.8 | 0.8182 | 0.8095 | -0.0095 | 0 | 3 | 7 | 0.4286 | 0 | 1.0 | comprometido | 0 |
| STU-0001 | 2026-08-04 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 1 | 74 | 11 | 0.8571 | 0.7273 | 0.8095 | 0.0476 | 5 | 0 | 7 | 0.0 | 0 | 1.0 | comprometido | 0 |
| STU-0001 | 2026-08-14 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 1 | 84 | 11 | 0.8 | 0.8182 | 0.8261 | -0.0261 | 2 | 3 | 7 | 0.4286 | 0 | 1.0 | comprometido | 0 |
| STU-0001 | 2026-08-24 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 1 | 94 | 11 | 1.0 | 0.9091 | 0.8571 | 0.1429 | 0 | 6 | 7 | 0.8571 | 0 | 1.0 | comprometido | 0 |
| STU-0001 | 2026-09-03 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 1 | 104 | 9 | 1.0 | 1.0 | 0.85 | 0.15 | 1 | 9 | 9 | 1.0 | 0 | 1.0 | comprometido | 0 |
| STU-0001 | 2026-09-13 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 1 | 114 | 8 | 1.0 | 1.0 | 0.8947 | 0.1053 | 4 | 11 | 11 | 1.0 | 0 | 1.0 | comprometido | 0 |
| STU-0002 | 2026-06-15 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 0 | 31 | 9 | 1.0 | 1.0 | 1.0 | 0.0 | 0 | 9 | 9 | 1.0 | 0 | 1.0 | intermitente | 0 |
| STU-0002 | 2026-06-25 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 0 | 41 | 11 | 0.8333 | 0.9091 | 0.9286 | -0.0952 | 0 | 4 | 9 | 0.4444 | 0 | 1.0 | intermitente | 0 |
| STU-0002 | 2026-07-05 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 0 | 51 | 10 | 0.8571 | 0.8 | 0.8824 | -0.0252 | 4 | 0 | 9 | 0.0 | 0 | 1.0 | intermitente | 0 |
| STU-0002 | 2026-07-15 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 0 | 61 | 13 | 0.8333 | 0.8462 | 0.9048 | -0.0714 | 0 | 4 | 9 | 0.4444 | 0 | 1.0 | intermitente | 0 |
| STU-0002 | 2026-07-25 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 0 | 71 | 11 | 0.8 | 0.8182 | 0.8571 | -0.0571 | 0 | 1 | 9 | 0.1111 | 0 | 1.0 | intermitente | 0 |
| STU-0002 | 2026-08-04 | espejo_real | Master Fut MR | Categoria 20/21 | 4 | activo | 0 | 81 | 11 | 0.8571 | 0.9091 | 0.8571 | 0.0 | 1 | 5 | 9 | 0.5556 | 0 | 1.0 | intermitente | 0 |

## `deleted_students.csv` — 70 filas

Columnas: `deleted_student_id`, `school_id`, `original_student_id`, `full_name`, `birth_date`, `category_id`, `deleted_at`

| deleted_student_id | school_id | original_student_id | full_name | birth_date | category_id | deleted_at |
|---|---|---|---|---|---|---|
| DEL-0001 | SCH-0001 | STU-0006 | Fernanda Flores Ramirez | 2021-12-06 | CAT-0001 | 2026-09-29 |
| DEL-0002 | SCH-0001 | STU-0010 | Fernando Garcia Rodriguez | 2021-11-23 | CAT-0001 | 2026-10-18 |
| DEL-0003 | SCH-0001 | STU-0016 | Raul Sanchez Mendoza | 2018-06-14 | CAT-0002 | 2026-09-27 |
| DEL-0004 | SCH-0001 | STU-0020 | Daniela Aguilar Aguilar | 2019-09-13 | CAT-0002 | 2026-09-29 |
| DEL-0005 | SCH-0001 | STU-0021 | Fernando Gutierrez Romero | 2020-09-12 | CAT-0002 | 2026-07-20 |
| DEL-0006 | SCH-0001 | STU-0022 | Luis Alvarez Hernandez | 2019-03-27 | CAT-0002 | 2026-06-23 |
| DEL-0007 | SCH-0001 | STU-0039 | Mateo Ruiz Morales | 2018-09-20 | CAT-0002 | 2026-07-08 |
| DEL-0008 | SCH-0001 | STU-0043 | Daniel Lopez Cruz | 2017-06-14 | CAT-0003 | 2026-09-14 |
| DEL-0009 | SCH-0001 | STU-0053 | Jesus Diaz Rodriguez | 2017-02-24 | CAT-0003 | 2026-06-28 |
| DEL-0010 | SCH-0001 | STU-0057 | Alejandro Mendoza Hernandez | 2015-02-08 | CAT-0004 | 2026-09-23 |
| DEL-0011 | SCH-0001 | STU-0058 | Jesus Castillo Mendoza | 2014-05-25 | CAT-0004 | 2026-09-22 |
| DEL-0012 | SCH-0001 | STU-0063 | Mateo Alvarez Morales | 2015-08-14 | CAT-0004 | 2026-08-23 |
| DEL-0013 | SCH-0001 | STU-0071 | Eduardo Ruiz Castillo | 2014-01-18 | CAT-0004 | 2026-06-26 |
| DEL-0014 | SCH-0001 | STU-0072 | Alejandro Torres Gonzalez | 2015-08-11 | CAT-0004 | 2026-10-03 |
| DEL-0015 | SCH-0001 | STU-0073 | Emiliano Ruiz Torres | 2015-03-19 | CAT-0004 | 2026-10-20 |

## `payments.csv` — 960 filas

Columnas: `payment_id`, `school_id`, `student_id`, `amount`, `payment_date`, `payment_type`, `payment_month`, `payment_year`, `dias_atraso`

| payment_id | school_id | student_id | amount | payment_date | payment_type | payment_month | payment_year | dias_atraso |
|---|---|---|---|---|---|---|---|---|
| PAY-0001 | SCH-0001 | STU-0001 | 450 | 2026-05-22 | mensualidad | 5 | 2026 | 0 |
| PAY-0002 | SCH-0001 | STU-0001 | 450 | 2026-06-05 | mensualidad | 6 | 2026 | 0 |
| PAY-0003 | SCH-0001 | STU-0001 | 450 | 2026-07-19 | mensualidad | 7 | 2026 | 14 |
| PAY-0004 | SCH-0001 | STU-0001 | 450 | 2026-08-10 | mensualidad | 8 | 2026 | 5 |
| PAY-0005 | SCH-0001 | STU-0001 | 450 | 2026-09-07 | mensualidad | 9 | 2026 | 2 |
| PAY-0006 | SCH-0001 | STU-0001 | 450 | 2026-10-05 | mensualidad | 10 | 2026 | 0 |
| PAY-0007 | SCH-0001 | STU-0002 | 450 | 2026-05-17 | mensualidad | 5 | 2026 | 12 |
| PAY-0008 | SCH-0001 | STU-0002 | 450 | 2026-06-07 | mensualidad | 6 | 2026 | 2 |
| PAY-0009 | SCH-0001 | STU-0002 | 450 | 2026-07-08 | mensualidad | 7 | 2026 | 3 |
| PAY-0010 | SCH-0001 | STU-0002 | 450 | 2026-08-05 | mensualidad | 8 | 2026 | 0 |
| PAY-0011 | SCH-0001 | STU-0002 | 450 | 2026-10-07 | mensualidad | 10 | 2026 | 2 |
| PAY-0012 | SCH-0001 | STU-0003 | 450 | 2026-06-05 | mensualidad | 6 | 2026 | 0 |
| PAY-0013 | SCH-0001 | STU-0003 | 450 | 2026-07-15 | mensualidad | 7 | 2026 | 10 |
| PAY-0014 | SCH-0001 | STU-0003 | 450 | 2026-08-06 | mensualidad | 8 | 2026 | 1 |
| PAY-0015 | SCH-0001 | STU-0003 | 450 | 2026-09-05 | mensualidad | 9 | 2026 | 0 |

## `schools.csv` — 7 filas

Columnas: `school_id`, `name`, `origen`

| school_id | name | origen |
|---|---|---|
| SCH-0001 | Master Fut MR | espejo_real |
| SCH-0002 | Alcones Rayados | espejo_real |
| SCH-0003 | Gallos Verdes FC | espejo_real |
| SCH-0004 | Demo Test Academy 2 | espejo_real |
| SCH-0005 | Academia Demo 2 | espejo_real |
| SCH-0006 | Gallos San Rafael | simulada |
| SCH-0007 | Master Fut MR Aguascalientes | simulada |

## `students.csv` — 256 filas

Columnas: `student_id`, `school_id`, `school_name`, `category_id`, `category_name`, `full_name`, `birth_date`, `edad`, `fecha_alta`, `fecha_baja`, `status`, `uniform_delivered`, `current_streak`, `max_streak`, `last_attendance_date`, `perfil_latente`, `origen`

| student_id | school_id | school_name | category_id | category_name | full_name | birth_date | edad | fecha_alta | fecha_baja | status | uniform_delivered | current_streak | max_streak | last_attendance_date | perfil_latente | origen |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| STU-0001 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Ximena Morales Gutierrez | 2022-07-13 | 4 | 2026-05-22 |  | activo | True | 2 | 22 | 2026-10-21 | comprometido | espejo_real |
| STU-0002 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Fernanda Gutierrez Mendoza | 2022-02-15 | 4 | 2026-05-15 |  | activo | False | 5 | 9 | 2026-10-21 | intermitente | espejo_real |
| STU-0003 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Leonardo Lopez Ortiz | 2022-12-09 | 4 | 2026-05-29 |  | activo | True | 20 | 20 | 2026-10-21 | comprometido | espejo_real |
| STU-0004 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Diego Cruz Alvarez | 2020-02-28 | 6 | 2026-05-25 |  | pendiente | True | 0 | 7 | 2026-10-12 | en_fuga | espejo_real |
| STU-0005 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Adrian Mendoza Hernandez | 2021-06-18 | 5 | 2026-05-26 |  | activo | True | 1 | 10 | 2026-10-21 | intermitente | espejo_real |
| STU-0006 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Fernanda Flores Ramirez | 2021-12-06 | 5 | 2026-05-15 | 2026-09-29 | inactivo | True | 3 | 16 | 2026-09-28 | comprometido | espejo_real |
| STU-0007 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Adrian Cruz Aguilar | 2021-04-02 | 5 | 2026-05-21 |  | activo | False | 25 | 25 | 2026-10-21 | moroso | espejo_real |
| STU-0008 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Valentina Torres Gomez | 2021-09-10 | 5 | 2026-05-14 |  | beca | True | 7 | 8 | 2026-10-21 | moroso | espejo_real |
| STU-0009 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Leonardo Gonzalez Morales | 2021-05-10 | 5 | 2026-05-09 |  | activo | True | 17 | 24 | 2026-10-21 | comprometido | espejo_real |
| STU-0010 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Fernando Garcia Rodriguez | 2021-11-23 | 5 | 2026-05-07 | 2026-10-18 | inactivo | True | 0 | 14 | 2026-10-12 | intermitente | espejo_real |
| STU-0011 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Jimena Ortiz Mendoza | 2021-02-09 | 5 | 2026-05-14 |  | activo | True | 18 | 28 | 2026-10-21 | comprometido | espejo_real |
| STU-0012 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Isabella Vargas Alvarez | 2021-10-13 | 5 | 2026-05-17 |  | activo | True | 17 | 27 | 2026-10-21 | comprometido | espejo_real |
| STU-0013 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Pablo Rodriguez Jimenez | 2021-10-08 | 5 | 2026-05-19 |  | activo | False | 15 | 21 | 2026-10-21 | comprometido | espejo_real |
| STU-0014 | SCH-0001 | Master Fut MR | CAT-0001 | Categoria 20/21 | Ximena Perez Lopez | 2021-07-16 | 5 | 2026-08-30 |  | activo | True | 0 | 11 | 2026-10-14 | comprometido | espejo_real |
| STU-0015 | SCH-0001 | Master Fut MR | CAT-0002 | Categoria 18/19 | Hector Sanchez Gonzalez | 2018-08-08 | 8 | 2026-06-11 |  | beca | True | 3 | 12 | 2026-10-21 | intermitente | espejo_real |

## `trainings.csv` — 1436 filas

Columnas: `training_id`, `school_id`, `category_id`, `venue_id`, `date`, `start_time`, `type`, `is_cancelled`, `is_completed`

| training_id | school_id | category_id | venue_id | date | start_time | type | is_cancelled | is_completed |
|---|---|---|---|---|---|---|---|---|
| TRN-0001 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-05-11 | 17:00 | entrenamiento | False | True |
| TRN-0002 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-05-13 | 17:00 | entrenamiento | False | True |
| TRN-0003 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-05-18 | 17:00 | entrenamiento | False | True |
| TRN-0004 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-05-20 | 17:00 | entrenamiento | False | True |
| TRN-0005 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-05-25 | 17:00 | entrenamiento | False | True |
| TRN-0006 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-05-27 | 17:00 | entrenamiento | False | True |
| TRN-0007 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-05-30 | 09:00 | partido | False | True |
| TRN-0008 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-06-01 | 17:00 | entrenamiento | False | True |
| TRN-0009 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-06-03 | 17:00 | entrenamiento | False | True |
| TRN-0010 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-06-08 | 17:00 | entrenamiento | False | True |
| TRN-0011 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-06-10 | 17:00 | entrenamiento | True | False |
| TRN-0012 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-06-15 | 17:00 | entrenamiento | False | True |
| TRN-0013 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-06-17 | 17:00 | entrenamiento | False | True |
| TRN-0014 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-06-20 | 09:00 | partido | False | True |
| TRN-0015 | SCH-0001 | CAT-0001 | VEN-0004 | 2026-06-22 | 17:00 | entrenamiento | False | True |

## `venues.csv` — 5 filas

Columnas: `venue_id`, `school_id`, `name`, `latitud`, `longitud`

| venue_id | school_id | name | latitud | longitud |
|---|---|---|---|---|
| VEN-0001 | SCH-0002 | Unidad Deportiva Lopez Mateos | 20.6736 | -103.344 |
| VEN-0002 | SCH-0003 | Cancha Las Aguilas | 20.6597 | -103.3496 |
| VEN-0003 | SCH-0004 | Campo Tlaquepaque | 20.6409 | -103.312 |
| VEN-0004 | SCH-0005 | Deportivo Zapopan Norte | 20.7214 | -103.3918 |
| VEN-0005 | SCH-0006 | Cancha Municipal Tonala | 20.6243 | -103.234 |
