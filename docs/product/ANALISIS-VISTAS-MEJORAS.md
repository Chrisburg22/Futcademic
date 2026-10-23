---
title: "Futcademic — Análisis de vistas y plan de mejora de producto"
subtitle: "Auditoría vista por vista: casos de uso, UX/UI y palancas de rentabilidad"
date: "23 de octubre de 2026"
author:
  - name: "Product Owner"
---

# Análisis de vistas y plan de mejora de producto

## Alcance de esta auditoría

Se revisó el código real de la aplicación en `web/` (29 rutas, 5 roles), el esquema
de base de datos (`schema.sql` + 4 migraciones), el landing (`landing/src/consts.ts`)
y la definición de producto vigente (`docs/product/DEFINICION-PRODUCTO.md`).

Dos aclaraciones que cambian el contexto del análisis:

1. **No existe `mobile/` ni `backend/` en el repositorio.** El `CLAUDE.md` todavía
   describe tres workspaces (Expo + Express + Vite). Lo que hay hoy es una PWA
   (`web/`) que consume una API externa vía `VITE_API_URL`. La definición de
   producto sigue prometiendo "aplicación Expo React Native para iOS/Android":
   eso ya no es cierto y hay que corregirlo o volver a construirlo.
2. **El producto es un Tool (software de autoservicio), no un Managed Service.**
   Está bien clasificado. El problema no es la clasificación: es que el *Día 1 del
   comprador* no está diseñado dentro del producto (ver §2.1).

---

## 1. Veredicto ejecutivo

Futcademic tiene una base sólida: multi-tenancy limpio, 5 roles bien separados,
PWA instalable con caché offline, y 4 módulos que efectivamente comparten una sola
base de datos. Para una beta, el alcance funcional es respetable.

El producto falla en tres planos distintos, y conviene no mezclarlos:

| Plano | Diagnóstico | Consecuencia comercial |
|---|---|---|
| **Activación** | El administrador —el único que paga— es el único rol sin onboarding guiado. Entra a un dashboard de ceros. | Abandono en la primera sesión. Es el cuello de botella #1 de rentabilidad. |
| **Trabajo diario** | El pase de lista, que es el acto que ocurre 5 veces por semana por categoría, exige 3 selecciones manuales y no tiene "marcar todos". No funciona sin conexión. | El profesor vuelve al cuaderno. Sin asistencias no hay datos y el producto se vacía. |
| **Promesa vs. realidad** | El landing promete PDF/Excel, notificaciones push al teléfono del padre, y recurrencia quincenal/mensual. Nada de eso existe en el código. | Churn en semana 2 y daño a la credibilidad justo cuando empiezas a cobrar. |

**La pregunta dura del marco de Product Owner — "¿qué hace un cliente que paga en
sus primeros 30 días?" — hoy no tiene respuesta dentro del producto.** Tiene una
respuesta en el landing ("crea categoría, invita profesor, da de alta alumnos"),
pero el producto no la conduce: no hay checklist de arranque, no hay estados
vacíos con llamada a la acción, no hay carga masiva. El cliente tiene que
adivinar el orden correcto.

---

## 2. Discrepancias entre lo prometido y lo construido

Esto va primero porque es deuda de credibilidad, no deuda técnica. Cada fila es
una afirmación pública que el código no respalda.

| Promesa | Dónde se promete | Qué hay en el código | Severidad |
|---|---|---|---|
| "Exportas a PDF y Excel" | `landing` PRUEBA, DEFINICION-PRODUCTO | Solo CSV. Cero referencias a PDF o XLSX en todo `web/src`. | **Alta** |
| "El padre recibe la notificación en su teléfono" | `landing` PRUEBA y ROLES | No hay registro de Push API ni service worker de push. `users.push_token` existe en la tabla pero nadie lo escribe desde la web. Solo hay una campanita in-app. | **Alta** |
| "Repites semanal, quincenal o mensualmente" | `landing` MODULOS, DEFINICION-PRODUCTO | `EventsPage.tsx:259` solo expone "Repetir semanas (0 = sin repetir)". No hay quincenal ni mensual en la UI. | **Media** |
| "Aplicación Expo para iOS/Android" | DEFINICION-PRODUCTO, CLAUDE.md | No existe el workspace `mobile/`. | **Alta** (documental) |
| Dashboard admin con "pagos pendientes" | `landing` ROLES, texto alt de la captura | `AdminDashboard.tsx` muestra 4 tarjetas: alumnos activos, total, ingreso, asistencia. **No muestra pendientes.** | **Media** |
| Dashboard padre con "su próximo entrenamiento" | `landing` ROLES | `ParentDashboard.tsx` muestra hijos y alerta de pago. No muestra próximo entrenamiento (el de alumno sí). | **Media** |
| Marca "Futcademic" | Landing, login, PWA manifest | El soporte apunta a `soporte@futcamedic.com` (`SupportPage.tsx:16,40`, `TermsPage.tsx:32`) y el paquete se llama `futcamedic-web`. Dos marcas conviviendo. | **Baja pero visible** |

**Recomendación:** antes de cobrar un peso, o se construye, o se baja del landing.
El apartado "Lo que todavía no hace" del landing es un activo de confianza
excelente; estas filas deberían vivir ahí mientras no existan.

### 2.1 El agujero de activación del administrador

`AuthGate.tsx` redirige a `/onboarding` únicamente a `profesor`, `padre` y
`alumno`. El `admin` y el `super_admin` —quienes registran la academia y quienes
eventualmente pagarán— entran directo a un dashboard con cuatro guiones (`—`),
cero categorías y cero alumnos, y un sidebar con 12 entradas sin jerarquía de
"empieza aquí".

Esto es el defecto de producto más caro del sistema. El resto del análisis
importa menos que esto.

**Qué debe existir:**

1. Un asistente de arranque para el admin, de 4 pasos, que se pueda retomar:
   crear primera categoría (con cuota mensual) → invitar primer profesor →
   dar de alta primeros alumnos → programar el primer entrenamiento recurrente.
2. Una tarjeta de progreso persistente en el dashboard ("3 de 4 pasos") hasta
   completarse.
3. Estados vacíos accionables. El componente `EmptyState` ya acepta una prop
   `action` y **no se usa en ninguna de las 29 vistas**. Cada estado vacío hoy
   es un callejón sin salida.
4. Datos de ejemplo borrables de un clic, para que el dashboard no se vea muerto
   en la primera sesión.

---

## 3. Análisis vista por vista

### 3.1 Autenticación y entrada

#### `/login` — `pages/auth/LoginPage.tsx`

Correcto en lo esencial: validación, `autoComplete`, y el botón de instalación
PWA antes del login (buena decisión: el padre llega desde el móvil).

**Faltantes:**
- **No hay "olvidé mi contraseña".** Supabase lo soporta con una línea
  (`resetPasswordForEmail`). Hoy un padre que olvida su clave tiene que escribirle
  al dueño de la academia, que tampoco puede resolverlo desde el panel. Esto
  genera soporte manual desde el día 1.
- Los errores se muestran crudos desde Supabase, en inglés (`Invalid login
  credentials`). Hay que mapearlos a español.
- No hay enlace de vuelta al landing ni logo de la academia.

#### `/student-login` — `pages/auth/StudentLoginPage.tsx`

El acceso por `username` para menores sin correo es una decisión de producto
acertada y poco común en la competencia.

**Riesgos y faltantes:**
- `POST /auth/resolve-student` devuelve el **correo real** a partir de un usuario,
  sin autenticación previa. Es un endpoint de enumeración: permite descubrir
  correos de menores probando nombres de usuario. Debe resolverse en el servidor
  (login directo por username) o, como mínimo, con rate limiting severo y correos
  sintéticos no reutilizables.
- No se le dice al alumno dónde conseguir su usuario si no lo tiene.

#### `/register` — `pages/auth/RegisterPage.tsx`

Cuatro campos y a producción. Bien.

**Faltantes:**
- No pide número de alumnos ni ciudad. Ese dato, capturado aquí, es el que
  después te permite segmentar precio y priorizar roadmap. Es el momento de
  mayor disposición a contestar y lo estás desperdiciando.
- No hay aceptación explícita de términos ni de tratamiento de datos de menores.
  En México, con datos de menores de edad y LFPDPPP de por medio, esto no es
  opcional.
- Tras registrar se redirige al login con un `setTimeout` de 1.5 s; debería
  iniciar sesión automáticamente y caer en el asistente de arranque.

#### `/accept-invite` y `/change-password`

Bien resueltos. El manejo del `token_hash` sin exponer el dominio de Supabase y
el fallback al formato legacy están cuidados, igual que los mensajes de enlace
expirado.

- `AcceptInvitePage` exige 8 caracteres; `ChangePasswordPage` y `SecurityPage`
  exigen 6. Unificar en 8 y mostrar medidor de fortaleza.
- Falta un botón de "reenviar invitación" en la vista de Profesores para cuando
  el enlace expira. Hoy eso es un ticket de soporte.

#### `/onboarding` — `pages/OnboardingPage.tsx`

Nombre, apellido, teléfono. Correcto para profesor/padre/alumno.

- No aplica al admin (ver §2.1), que es el problema.
- Para el rol `alumno` podría capturar apodo, posición y número favorito: las
  columnas `apodo`, `posicion`, `numero_favorito` ya existen en `users` y
  **ninguna vista las usa**. Es gamificación gratis, ya pagada en el esquema.

---

### 3.2 Dashboards (`/`)

#### Admin — `pages/dashboard/AdminDashboard.tsx`

Cuatro métricas y cuatro accesos directos. Es un dashboard de *vanidad*: dice
cómo está la academia, no qué hacer hoy.

**Lo que falta, en orden de valor:**
- **Dinero pendiente del mes, en pesos y con un botón de acción.** Hoy "ingreso
  mensual" está, pero el adeudo —que es la métrica que mueve la caja— solo se ve
  entrando a Finanzas → pestaña Pendientes. Debe estar en la primera pantalla,
  en rojo, y debe ser clicable.
- **Alumnos en riesgo de fuga.** El propio landing define el dolor: *"nadie puede
  decirte qué alumno lleva tres semanas sin venir, y para cuando te enteras, ya se
  fue"*. El producto tiene todos los datos (`attendances`, `last_attendance_date`)
  y **no resuelve ese dolor en ninguna vista**. Es la función más valiosa que no
  existe. Un bloque "3 alumnos sin asistir en 3 semanas" con el teléfono del padre
  a un clic justifica por sí solo la suscripción.
- **Sesiones de hoy y cuáles no tienen lista pasada.** Control operativo real
  sobre los profesores.
- Tendencia, no fotografía: un sparkline de asistencia e ingresos de los últimos
  6 meses. `@mantine/charts` y `recharts` ya están instalados y **no se usan en
  ninguna vista**.
- Los importes se renderizan como `${dash.monthlyIncome}` sin formato. Debe ser
  `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`. En todo el
  código no hay un solo uso de `Intl`.

#### Profesor — `pages/dashboard/TeacherDashboard.tsx`

Muestra categorías y sesiones de hoy. Está cerca de ser bueno, pero le falta el
verbo.

- La tarjeta de sesión de hoy **no lleva a pasar lista**. El profesor ve su sesión
  y tiene que ir al sidebar, abrir Asistencias, elegir categoría, elegir fecha y
  elegir tipo — cinco acciones para hacer lo único que vino a hacer. Debe ser un
  botón "Pasar lista" en la tarjeta, que abra la lista ya precargada.
- No distingue sesión ya registrada de sesión pendiente. Solo hay un badge
  "Completada" que depende de un flag que la vista de asistencias nunca escribe.
- No muestra alumnos nuevos de la semana ni avisos del admin.

#### Padre — `pages/dashboard/ParentDashboard.tsx`

Tarjetas de hijos con dos badges. Funcional y pobre.

- Falta el **próximo entrenamiento** (prometido en el landing): día, hora y
  cancha. Es la información que el padre consulta de verdad, varias veces por
  semana. Sin esto, el padre no abre la app y el WhatsApp sigue ganando.
- Falta el **porcentaje de asistencia del hijo** y su racha: es la prueba de
  valor que justifica la mensualidad frente al padre.
- `dash.paymentAlert` es una cadena de texto desde el backend; debería ser un dato
  estructurado (monto, mes, botón "ver estado de cuenta").

#### Alumno — `pages/dashboard/StudentDashboard.tsx`

Racha, sesiones del mes, logros, categoría. Es la mejor pantalla del producto en
intención: es la única que genera hábito.

- La racha no se celebra. No hay animación, ni "te faltan 2 para tu récord", ni
  comparación con el equipo. Una racha sin fricción emocional es un número.
- No hay tabla de posiciones de asistencia de la categoría. Es el motor de
  retención más barato que puedes construir con los datos que ya tienes.
- `achievements` existe con tipos `goles` y `puntualidad` en el esquema, pero el
  producto no captura goles ni hora de llegada. Hay logros imposibles de
  desbloquear.

---

### 3.3 Asistencias (`/attendance`)

Es la vista de mayor frecuencia de uso de todo el sistema y la que peor resuelta
está para el contexto real: un profesor, de pie en una cancha, con sol y mala
señal.

#### Defecto de permisos (corregir ya)

`AttendancePage.tsx:38` enruta solo a `padre` hacia la vista de consulta; **todo
lo demás, incluido el rol `alumno`, cae en la vista de pase de lista**. La ruta
en `App.tsx` no restringe roles y el `Sidebar.tsx:27` muestra "Asistencias" a
todos. Un alumno que entra ahí ve el selector de categorías de la academia e
intenta pasar lista. En el mejor caso recibe un 403 y una pantalla rota; en el
peor, depende de que el backend lo bloquee.

#### Pase de lista — fricción operativa

- **No hay "marcar todos presentes".** En fútbol la asistencia normal ronda el
  80-90 %: el flujo correcto es marcar todos y desmarcar los 2 o 3 ausentes. Hoy
  son 20 toques en lugar de 3. Este solo cambio decide si el profesor usa la app
  o el cuaderno.
- **No hay contador en vivo** (`14/18 presentes`) ni resumen antes de guardar.
- **No se conecta con la sesión programada.** El profesor elige categoría, fecha y
  tipo a mano, aunque el sistema ya sabe qué sesión hay hoy (`trainings`). Peor:
  puede pasar lista de una sesión cancelada sin que nada lo advierta.
- **No funciona sin conexión.** El service worker cachea solo GET
  (`vite.config.ts`, `runtimeCaching`); no hay cola de escrituras. En una cancha
  sin señal el guardado falla y se pierde el trabajo. Para una PWA que se vende
  como "la usas en la cancha", una cola offline con Background Sync no es una
  mejora: es un requisito.
- `useEffect` sincroniza las marcas desde el servidor cada vez que cambia
  `existing`; si el profesor va marcando y llega un refetch, **se le borran las
  marcas no guardadas**. Hay que proteger el estado sucio.
- No se registra quién pasó lista ni a qué hora, aunque `attendances.teacher_id`
  existe en el esquema. Sin eso no hay supervisión posible.
- No hay justificación de ausencia (enfermedad, permiso). Presente/Ausente binario
  le resta credibilidad al reporte frente al padre.

#### Histórico — `components/attendance/CategoryAttendanceHistory.tsx`

Agrupación por sesión con barra de progreso y semáforo. Es el mejor componente
del código.

- Falta la vista que de verdad importa: **matriz alumno × sesión** con el
  porcentaje por alumno. Hoy el histórico está ordenado por sesión; el dueño
  necesita ordenar por alumno para detectar al que se está yendo.
- Sin filtro por rango de fechas ni exportación de ese histórico.

#### Vista del padre

Lista cronológica de tarjetas. Le falta el encabezado con el porcentaje del mes y
la racha. El padre no quiere 40 tarjetas: quiere un número.

---

### 3.4 Finanzas (`/finances`)

Es el módulo que justifica el precio y el que tiene más deuda funcional.

#### Vista admin

- **Las pestañas Alumnos y Profesores comparten la misma consulta filtrada por
  `tab`** (`FinancesPage.tsx`), de modo que al cambiar de pestaña se refetchea
  todo. Funciona, pero el estado de carga y los vacíos quedan confusos.
- **No hay totales.** Una lista de pagos sin "total cobrado", "total pendiente" y
  "margen tras pagos a profesores" obliga al dueño a sumar a mano. Es exactamente
  lo que venías a eliminar del Excel.
- La pestaña **Pendientes solo muestra el nombre**. Falta: cuánto debe, cuántos
  meses lleva, teléfono del padre y un botón de recordatorio. Esa pestaña debería
  ser una herramienta de cobranza, no una lista de nombres.
- **No hay recordatorio de cobro.** Ni botón de WhatsApp con mensaje prellenado,
  ni correo, ni notificación. Es la función de mayor retorno directo para el
  cliente y la más barata de construir: un enlace `wa.me` con plantilla.
- **No hay recibo.** El padre paga en efectivo y no recibe comprobante. Un PDF con
  el logo de la academia es la pregunta abierta #3 de la definición de producto:
  la respuesta es sí, y además es la función que el padre le pide al dueño.
- Los meses se generan con `dayjs().month(i).format('MMMM')` (`FinancesPage.tsx:37`)
  y **no se importa el locale `es` en ninguna parte del proyecto**: el selector
  dice "January, February…". Mismo problema en todas las fechas con formato `MMM`.
- Importes sin formato de moneda (`${p.amount}`), en toda la vista.
- No hay registro de ingresos y egresos generales, aunque `PaymentType` en
  `types/index.ts` ya contempla `ingreso` y `egreso` y el esquema no los permite
  (el `CHECK` solo acepta `mensualidad` y `pago_profesor`). Tipos y base de datos
  están desalineados.
- No hay pagos parciales, descuentos por hermano, ni inscripciones o uniformes
  como concepto cobrable. Las academias cobran las tres cosas.

#### Vista padre

El estado de cuenta (cuota, adeudo, total pagado, al día/pendiente) está bien
planteado. Le falta:

- Historial por mes con marca visual de qué meses están cubiertos.
- Comprobante descargable.
- Y, sobre todo, **una forma de pagar**. Ver que debes y no poder pagar es
  frustración pura (ver §5).

---

### 3.5 Alumnos (`/admin/students`)

#### Escala — el producto no soporta a su propio cliente objetivo

El ICP declarado son academias de **50 a 500 alumnos**. Esta vista:

- Renderiza **todos** los alumnos en una sola tabla sin paginación ni
  virtualización.
- **No tiene buscador por nombre.** Solo un filtro por categoría.
- No tiene ordenamiento por columna, ni filtro por estatus, ni selección múltiple.

Con 300 alumnos esta pantalla es inusable en un teléfono. Buscador + paginación
no son mejoras cosméticas: son la diferencia entre servir o no servir al cliente
que dices servir.

#### Riesgo de datos: estatus desalineado

El selector ofrece `activo`, `becado`, `pendiente_pago`, `inactivo`
(`StudentsPage.tsx:155-156`). El `CHECK` de la tabla `students` acepta `activo`,
`beca`, `pendiente`, `inactivo`. O el backend traduce, o dos de las cuatro
opciones fallan silenciosamente. Hay que verificarlo y unificar en un solo
vocabulario.

#### Otros huecos

- **No hay carga masiva por CSV.** Declarado como limitación conocida, y es la
  barrera de entrada más alta que tienes: un dueño con 200 alumnos en Excel no va
  a capturarlos a mano. Mientras no exista, cada alta de cliente es un servicio
  manual tuyo. Esto no escala y es lo que te impide crecer sin contratar.
- El cambio de estatus es un `Select` dentro de la tabla que dispara una mutación
  en cada cambio, **sin confirmación y sin deshacer**. Un toque accidental en
  móvil desactiva a un alumno.
- El toggle de uniforme no muestra estado de carga ni confirma.
- La eliminación avisa que "se archiva" (existe `deleted_students`) pero
  `useGetDeletedStudents` consume `/students/deleted` y **ninguna vista lo
  muestra**. Hay papelera en el backend y no hay papelera en la interfaz.
- El modal de edición no valida nada (el de creación sí).
- `medical_notes` es un `TextInput` de una línea para información médica. Debe ser
  `Textarea`, y debería ser visible para el profesor en el pase de lista: ese es
  el momento en que importa.

#### Alta de alumno — `StudentWizard.tsx`

Asistente de 3 pasos con resumen antes de confirmar. Bien construido.

- **El correo del alumno es obligatorio.** Para un niño de 8 años eso es falso en
  la realidad: el dueño va a inventar correos. Debería ser opcional y ofrecer en
  su lugar generar el `username` de acceso (la columna ya existe por migración).
- No se asigna ni se muestra el `username`/código del alumno al terminar, aunque
  `ChildrenPage` pide exactamente ese "código del alumno" para vincular. El
  circuito está roto: nadie sabe de dónde sale ese código.
- No permite registrar dos tutores (pregunta abierta #4 de la definición de
  producto: en separaciones y familias extendidas es lo normal). `parent_id` es
  una sola llave foránea; requiere tabla intermedia.
- No permite alta múltiple seguida ("guardar y crear otro"), que es como se captura
  una categoría entera.

#### Detalle de alumno — `StudentDetailPage.tsx`

Buena vista: ficha, métricas, equipo, historial. Es casi la ficha de valor que el
padre pagaría por ver.

- No muestra teléfono, dirección, contacto de emergencia ni notas médicas, aunque
  están en el modelo. Justo los datos que necesitas en una urgencia en la cancha.
- No muestra el estado de cuenta del alumno. Asistencia y dinero viven separados
  cuando la pregunta real es "este que no paga, ¿al menos viene?".
- Historial limitado a `slice(0, 50)` sin aviso ni paginación.
- No se puede editar desde aquí: hay que volver a la lista.

---

### 3.6 Profesores (`/admin/teachers`)

- Lista sin estado de invitación. No se distingue al profesor que ya activó su
  cuenta del que nunca abrió el correo. **No hay reenviar invitación ni revocar.**
- **No se puede desactivar ni eliminar un profesor.** Pregunta abierta #2 de la
  definición de producto ("¿qué pasa cuando un profesor sale a mitad de
  temporada?"): hoy la respuesta es que se queda dentro con acceso a los datos.
  Es un problema de seguridad, no de comodidad.
- No muestra categorías asignadas ni número de alumnos en la tabla.
- El detalle (`TeacherDetailPage`) sí tiene la matriz de 6 permisos, que está
  bien, pero: no se pueden asignar categorías desde ahí (hay un endpoint
  `POST /categories/:id/teachers` que ninguna vista usa), no hay plantillas de
  permisos ("solo pase de lista", "coordinador"), y los cambios no se registran.
- No hay vista de pagos al profesor desde su ficha, aunque existen los datos.

---

### 3.7 Categorías (`/admin/categories`)

#### Bug de modelo de datos

`CategoriesPage.tsx:51,73` envía `birth_year: v.birth_year.sort().join('-')`, es
decir una cadena tipo `"2014-2015"`, mientras `categories.birth_year` es
`INTEGER NOT NULL` en el esquema. O el backend lo trunca, o falla, o la columna
cambió sin actualizar `schema.sql`. En cualquiera de los tres casos hay que
cerrarlo: una categoría con varios años de nacimiento necesita una tabla o un
array, no una cadena con guiones.

#### Faltantes de producto

- **No se puede editar la cuota mensual** desde ninguna vista, aunque
  `categories.monthly_fee` existe y es la base de todo el cálculo de adeudos
  (`CategoryDetailPage` la muestra como badge, nadie la escribe). La cifra que
  gobierna tus finanzas no tiene interfaz de edición.
- No se puede definir el **horario de la categoría** (día y hora fijos), aunque
  `TeamPage` ya pinta `team.schedules`. Hoy el horario solo existe como eventos
  sueltos.
- `category_teachers` permite varios profesores por categoría; la UI solo deja
  uno (`teacher_id`). El auxiliar técnico existe en la vida real.
- Falta cupo máximo y lista de espera: es la herramienta con la que una academia
  decide abrir un grupo nuevo.
- No se puede archivar una categoría al terminar la temporada.
- El detalle no muestra el porcentaje de asistencia agregado ni el estado de
  cobranza del grupo, que es el resumen que un dueño quiere por categoría.

---

### 3.8 Agenda (`/admin/events`)

- **Es una lista, no un calendario.** Para programar una temporada se navega día
  por día con un `DateInput`. Falta vista semanal y mensual; sin eso no se ven
  choques de horario ni huecos de cancha.
- La recurrencia se limita a "repetir N semanas". El esquema tiene
  `recurrence_rule jsonb` y `recurring_end_date` sin usar, y el landing promete
  quincenal y mensual. Falta además elegir **días de la semana** (lo normal es
  "martes y jueves", no "cada 7 días").
- No se valida choque de cancha ni de profesor: se pueden agendar dos categorías
  en la misma cancha a la misma hora.
- Cancelar una sesión no notifica a nadie, aunque el tipo de notificación
  `sesion_cancelada` ya existe en el `CHECK` de la tabla `notifications`. Ese
  aviso es precisamente el que hoy se pierde en el grupo de WhatsApp: es el dolor
  #4 del landing, y el producto tiene el 90 % hecho.
- No hay recordatorio previo a la sesión (`sesion_recordatorio`, también definido
  y sin usar).
- No se puede reprogramar una instancia: solo cancelarla.
- La agenda es exclusiva de admin. **El profesor no puede programar ni ver su
  agenda completa** pese a existir el permiso `can_manage_events`. El permiso está
  en la base de datos y no tiene interfaz.
- No hay convocatoria para partidos (qué alumnos van citados), que es el uso real
  del tipo `partido`.

---

### 3.9 Canchas (`/admin/venues`)

Vista CRUD correcta y completa en formulario.

- **Posible desajuste con el esquema:** el formulario envía `surface_type`,
  `has_lighting`, `is_covered`, `is_external` y la tabla `venues` de `schema.sql`
  solo tiene `name`, `address`, `notes`, `capacity`, `latitud`, `longitud`. No hay
  migración que agregue esos campos. Si el backend los ignora, el usuario cree
  que guardó datos que se perdieron — el peor tipo de error.
- Hay `latitud`/`longitud` en la tabla y en los tipos, pero ningún mapa ni enlace
  "cómo llegar" para el padre. Es una función de alto valor percibido y bajo costo.
- No se registra costo de renta por cancha, que es el principal egreso de una
  academia y el dato que falta para dar rentabilidad real por categoría.
- Eliminar una cancha no avisa si hay eventos que la usan.

---

### 3.10 Vistas de alumno (`/team`, `/stats`, `/achievements`)

Son las vistas que crean el hábito en el usuario final, y están subexplotadas.

- **`/team`**: compañeros, profesores y horarios. Bien. Falta foto grande del
  equipo, apodo y dorsal (campos existentes y sin usar) y cualquier elemento
  social.
- **`/stats`**: cuatro tarjetas y una tabla de asistencias. **Sin una sola
  gráfica**, teniendo `@mantine/charts` y `recharts` instalados. Una línea de
  asistencia mensual y un calendario tipo heatmap cambiarían por completo la
  percepción de la pantalla.
- **`/achievements`**: grilla de logros con bloqueados en opacidad. Falta barra de
  progreso por logro ("7 de 10 asistencias"), que es lo que convierte un logro en
  un motivador. Y falta que el logro se celebre al desbloquearse: hoy
  `useCheckAchievements` se dispara en silencio tras guardar asistencias y el
  alumno se entera cuando entra a mirar.
- El alumno no puede ver su propio estado de cuenta ni su próximo entrenamiento.
- Nada es compartible. Una tarjeta de racha exportable como imagen es marketing
  gratuito hecho por los propios padres.

---

### 3.11 Mis hijos (`/children`)

- **Riesgo de privacidad serio:** el formulario permite vincular un hijo por
  "código del alumno" **o por nombre completo** (`ChildrenPage.tsx`). Si el
  backend acepta el nombre sin verificación, cualquier padre registrado puede
  vincularse a cualquier menor de la academia escribiendo su nombre y acceder a
  sus asistencias, su estado de cuenta y sus datos. Esto debe verificarse de
  inmediato y, si es así, eliminar la vinculación por nombre o exigir aprobación
  del administrador.
- El "código del alumno" no se genera ni se muestra en ninguna vista de admin (ver
  §3.5). El flujo completo está desconectado.
- No hay vista de aprobación de solicitudes de vinculación del lado del admin.

---

### 3.12 Ajustes (`/profile`, `/settings/*`)

- **`/settings/notifications` es una pantalla falsa.** Tres interruptores sobre
  `useState` local (`NotificationsPage.tsx:6-8`) que no persisten nada y se
  reinician al recargar. Una preferencia que no se guarda es peor que no ofrecerla:
  el usuario cree que desactivó algo y sigue recibiendo avisos. Quitarla o
  conectarla, hoy.
- **`/settings/export` promete menos de lo anunciado y entrega raro.** Solo CSV
  (el landing dice PDF y Excel), y las etiquetas dicen "CSV del servidor" /
  "generado en cliente", que es vocabulario de implementación filtrado al usuario.
  Tampoco hay selección de rango de fechas: exporta todo o nada.
- **`/settings/support` abre un `mailto:`.** Si el usuario no tiene cliente de
  correo configurado —el caso normal en un teléfono Android con Gmail web— el
  botón no hace nada visible y el mensaje se pierde. Debe enviarse al backend y
  quedar registrado: además te da el canal de feedback que necesitas en beta.
- **`/settings/terms` tiene los términos en duro dentro de un componente React**,
  sin fecha de versión ni aviso de privacidad separado. Con datos de menores
  mexicanos, el aviso de privacidad formal no es opcional.
- No existe "eliminar mi cuenta" ni exportación de datos personales a petición
  (derechos ARCO).
- `/profile` y el sidebar duplican la navegación de ajustes con etiquetas
  distintas ("Academia" vs "Datos de la academia"). Unificar.
- Falta una vista de facturación/suscripción — que es donde cobrarás.

---

### 3.13 Asistente IA (`/admin/chat`)

La función más diferenciada del producto y la mejor implementada: streaming SSE,
actividad de herramientas visible, tarjeta de confirmación antes de ejecutar
acciones, historial de conversaciones. La confirmación explícita antes de mutar
datos es la decisión correcta y poco común.

**Problemas de producto:**
- **Está escondido.** Vive en el sidebar entre once entradas más. Es tu mayor
  diferenciador frente a una hoja de cálculo y lo tratas como una función más.
- Es exclusivo de `admin`. El profesor ("¿quién faltó la semana pasada en Sub-12?")
  y el padre ("¿cuándo entrena mi hijo?") son los casos de uso de mayor frecuencia
  y están fuera.
- No hay límite de uso ni telemetría de costo por academia. Con un modelo de
  lenguaje detrás, **cada conversación cuesta dinero real y hoy no se mide**. Antes
  de abrirlo hay que instrumentarlo o se come el margen.
- No hay historial de acciones ejecutadas por el asistente (quién pidió qué y qué
  cambió). Para un agente con permisos de escritura, eso es obligatorio.
- Las tres sugerencias iniciales son fijas; deberían depender del estado real de la
  academia ("tienes 8 pagos pendientes, ¿los reviso?").

---

## 4. Problemas transversales

### Bugs y riesgos para corregir ya

| # | Problema | Dónde | Riesgo |
|---|---|---|---|
| 1 | El rol `alumno` entra a la vista de pase de lista | `AttendancePage.tsx:38`, `App.tsx`, `Sidebar.tsx:27` | Permisos |
| 2 | Vinculación de hijo por nombre completo | `ChildrenPage.tsx` | Privacidad de menores |
| 3 | `resolve-student` expone correos sin autenticar | `StudentLoginPage.tsx` | Enumeración de datos |
| 4 | Estatus de alumno desalineado con el `CHECK` | `StudentsPage.tsx:155`, `schema.sql` | Datos |
| 5 | `birth_year` como cadena contra columna `INTEGER` | `CategoriesPage.tsx:51,73` | Datos |
| 6 | Campos de cancha inexistentes en el esquema | `VenuesPage.tsx:46-50` | Pérdida silenciosa de datos |
| 7 | Refetch borra marcas de asistencia no guardadas | `AttendancePage.tsx` | Pérdida de trabajo |
| 8 | Preferencias de notificación que no persisten | `NotificationsPage.tsx:6-8` | Confianza |
| 9 | Sin locale `es` en dayjs: meses en inglés | Todo el proyecto | Credibilidad |
| 10 | Sin formato de moneda | Finanzas, dashboards | Credibilidad |

### Calidad de interfaz

- **Sin estados vacíos accionables.** El `EmptyState` acepta `action` y no se usa
  nunca. 29 vistas con callejones sin salida.
- **Sin manejo de errores en la interfaz.** No hay `error boundary`, ni estado de
  error en las consultas: si una llamada falla, se ve un vacío indistinguible de
  "no hay datos". El usuario no sabe si está roto o vacío.
- **Sin skeletons.** `LoadingState` es un spinner genérico en todas partes; el
  contenido salta al cargar.
- **Sin confirmación optimista.** Cada mutación espera al servidor; en móvil con
  3G la interfaz se siente lenta.
- **Tablas no adaptadas a móvil.** `Table.ScrollContainer` con `minWidth` obliga a
  desplazamiento horizontal en el dispositivo donde el landing dice que se usa.
  Deberían ser tarjetas por debajo de `sm`.
- **Sin búsqueda global.** Con 300 alumnos, encontrar a uno exige recordar su
  categoría.
- **Accesibilidad parcial.** Hay `aria-label` en los iconos (bien), pero no hay
  gestión de foco en los modales, ni navegación por teclado en el pase de lista,
  ni contraste verificado para los textos `dimmed`.
- **Sin undo.** Ninguna acción destructiva o accidental se puede revertir desde la
  interfaz.

### Producto

- **Cero analítica de uso.** No hay instrumentación de ningún evento. No puedes
  saber cuántas academias completan el alta, cuántos profesores pasan lista la
  segunda semana, ni dónde abandonan. Estás optimizando a ciegas, y la pregunta
  abierta #5 de la definición ("¿cuál es la tasa de abandono a los 90 días?") es
  hoy incontestable.
- **Sin canal de comunicación academia → padres.** El dolor #4 del landing es el
  grupo de WhatsApp, y el producto no ofrece nada que lo reemplace: ni avisos
  masivos, ni confirmación de lectura. Las notificaciones existentes son solo
  transaccionales de pago.
- **Sin ciclo de temporada.** No hay concepto de temporada, ni promoción de
  categoría por edad al cambiar el año, ni archivado. En enero, cada academia
  tendrá que rehacer su estructura a mano.

---

## 5. Palancas de rentabilidad

El orden está por retorno sobre esfuerzo, no por dificultad.

### 5.1 Cobro en línea — la palanca grande

Hoy el producto *registra* dinero; no lo *mueve*. Mientras sea un registro, es un
Excel bonito y compite contra uno gratis.

Integrar pagos (Stripe, Mercado Pago o Clip, por mercado) cambia tres cosas a la vez:

- **Para la academia:** el cobro deja de ser una conversación incómoda. Eso solo ya
  vale más que toda la suscripción.
- **Para el padre:** paga desde el estado de cuenta que ya existe, en dos toques.
- **Para ti:** habilita el modelo de comisión por transacción, que escala con el
  cliente en lugar de con el número de cuentas. Una academia de 200 alumnos a
  $800 al mes mueve $160 000 mensuales; una comisión del 1 % sobre eso supera
  cualquier suscripción plana que puedas cobrar.

Es la diferencia entre vender una herramienta y ser infraestructura. Requiere
conciliación, reembolsos y soporte, y es el proyecto más grande de esta lista —
también el único que cambia el techo del negocio.

### 5.2 Retención de alumnos — lo que el cliente realmente compra

El dueño de una academia no compra software: compra que no se le vayan los
alumnos, porque cada baja son ~$800 al mes perdidos. Detectar y evitar bajas es
el valor por el que pagaría sin discutir.

Con los datos que **ya tienes**:

- Alerta de riesgo ("3 faltas seguidas", "asistencia por debajo del 50 %").
- Alerta de morosidad temprana (2 meses de adeudo).
- Informe mensual automático al padre con asistencia, racha y logros de su hijo:
  el padre que ve progreso no da de baja.

Esto es construible en semanas y es el argumento de venta más fuerte que puedes
tener. No existe hoy.

### 5.3 Reducir el costo de incorporación

Cada cliente nuevo hoy requiere captura manual de cientos de alumnos. Eso limita
cuántos clientes puedes aceptar y es, en la práctica, tu techo de crecimiento.

- Importación CSV con mapeo de columnas y vista previa.
- Asistente de arranque del admin (§2.1).
- Plantillas de academia ("fútbol base 6 categorías") que creen la estructura
  inicial de un clic.

### 5.4 Convertir alumnos y padres en canal

Cada academia trae de 50 a 500 familias. Hoy nada en el producto invita a otra
academia a entrar.

- Tarjeta de racha compartible con marca.
- Pie discreto "hecho con Futcademic" en los informes al padre durante la beta.
- Programa de referidos entre dueños de academia, que se conocen todos entre sí.

### 5.5 Estructura de precio que el producto pueda sostener

El landing declara beta gratuita y avisa con 30 días. Correcto para esta fase.
Para cuando toque cobrar, el producto necesita soportar:

- Medición de uso por academia (alumnos activos, mensajes al asistente IA).
- Límites por plan aplicados en la interfaz, con mensajes de actualización.
- Pantalla de facturación y suscripción, que hoy no existe.

Una estructura que encaja con lo construido: gratis hasta 25 alumnos;
escalonado por alumno activo después; asistente IA, cobro en línea y alertas de
retención en el plan superior. Nada de eso es construible sin la medición de uso,
que es lo primero.

---

## 6. Plan priorizado

### P0 — Antes de más usuarios en beta (1-2 semanas)

1. Corregir los 10 puntos de la tabla de §4.1 (permisos de `alumno`, vinculación
   por nombre, desalineaciones de esquema, locale y moneda).
2. Alinear el landing con la realidad: PDF/Excel, push y recurrencia quincenal
   pasan a "lo que todavía no hace" mientras no existan.
3. Actualizar `CLAUDE.md` y `DEFINICION-PRODUCTO.md`: no hay app Expo ni
   `backend/` en este repositorio.
4. Quitar o conectar `/settings/notifications`.
5. Recuperación de contraseña.
6. Instrumentación analítica mínima: alta, primera categoría, primer alumno,
   primer pase de lista, pase de lista en la semana 2.

### P1 — Activación y uso diario (3-6 semanas)

7. Asistente de arranque del admin + tarjeta de progreso + estados vacíos
   accionables.
8. Pase de lista: "marcar todos", contador en vivo, entrada directa desde la
   sesión de hoy, bloqueo de sesiones canceladas, protección del estado sucio.
9. Cola offline de escrituras para el pase de lista.
10. Buscador y paginación en Alumnos; tablas como tarjetas en móvil.
11. Finanzas: totales, adeudo en el dashboard, pendientes con monto y teléfono,
    recordatorio por WhatsApp.
12. Edición de la cuota mensual por categoría.
13. Importación CSV de alumnos.

### P2 — Valor diferencial (6-12 semanas)

14. Alertas de retención (riesgo de baja, morosidad temprana).
15. Informe mensual automático al padre.
16. Recibos en PDF con el logo de la academia.
17. Agenda en calendario, recurrencia por días de la semana, aviso de cancelación.
18. Gráficas reales en estadísticas y dashboards (ya tienes las librerías).
19. Notificaciones push reales en la PWA.
20. Asistente IA para profesor y padre, con medición de costo y límites.

### P3 — Escala y modelo de negocio

21. Cobro en línea y conciliación.
22. Medición de uso, planes, límites y pantalla de facturación.
23. Temporadas, promoción de categorías y archivado.
24. Multi-tutor por alumno; multi-profesor por categoría.
25. Avisos masivos academia → padres.

---

## 7. Qué medir desde el primer día

Sin estos números, el roadmap es opinión:

| Métrica | Definición | Meta inicial |
|---|---|---|
| Activación | Academias que llegan a su primer pase de lista en 7 días | > 60 % |
| Tiempo al primer valor | Del alta al primer pase de lista | < 48 h |
| Adopción del profesor | Profesores que pasan lista en la semana 2 | > 70 % |
| Adopción del padre | Padres que abren la app al menos una vez por semana | > 40 % |
| Retención de academia | Academias activas al día 90 | > 50 % |
| Dependencia | Pases de lista por academia por semana | > 8 |

La última es la que importa: una academia que registra ocho sesiones por semana no
cancela, porque el producto ya es el sistema de registro oficial. Ese es el
verdadero gancho de retención, y todo el P1 existe para alcanzarlo.

---

## 8. Preguntas abiertas que siguen sin respuesta

De la definición de producto original, y siguen vigentes:

1. ¿Cómo se maneja la falla de entrega de una notificación? (Hoy no hay push, así
   que la pregunta es anterior: ¿cómo se entera el padre de algo?)
2. ¿Qué pasa cuando un profesor sale a mitad de temporada? **No se puede
   desactivar. Hay que resolverlo.**
3. ¿Hace falta recibo en PDF con el logo? **Sí.** El padre que paga en efectivo lo
   pide, y es lo que hace que el pago registrado se sienta real.
4. ¿Varios tutores por alumno? **Sí**, y requiere cambio de modelo de datos.
5. ¿Cuál es la tasa de abandono a 90 días? **Incontestable hoy** — no hay
   analítica. Es el primer punto del P0.

Y una nueva, que es la más importante de todas:

6. **¿Cuántas academias están usando esto hoy, y cuántas pasaron lista la semana
   pasada?** Todo lo anterior es análisis de código. La siguiente conversación de
   producto debería empezar por ese dato, no por esta lista.
