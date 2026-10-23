---
title: "Futcademic — Catálogo de vistas"
subtitle: "Cada vista como unidad de producto: funciones, casos de uso y cobertura real"
date: "23 de octubre de 2026"
author:
  - name: "Product Owner"
---

# Catálogo de vistas de `web/`

Cada vista se documenta como una unidad de producto independiente: qué trabajo
resuelve, para quién, con qué frecuencia, qué funciones expone realmente contra
el backend, y qué intenta hacer el usuario que la vista no le deja hacer.

Este documento es el inventario. El diagnóstico y el plan de mejora están en
[`ANALISIS-VISTAS-MEJORAS.md`](ANALISIS-VISTAS-MEJORAS.md).

---

## 0. Mapa general

**29 rutas** definidas en `App.tsx`, de las cuales **15 declaran restricción por
rol** y 14 quedan abiertas a cualquier sesión autenticada.

### Qué ve cada rol

| Vista | super_admin | admin | profesor | padre | alumno |
|---|:--:|:--:|:--:|:--:|:--:|
| `/` Inicio | ● | ● | ● | ● | ● |
| `/onboarding` | ○ | ○ | ● | ● | ● |
| `/attendance` | ● | ● | ◐ | ● | ⚠ |
| `/finances` | ● | ● | ◐ | ● | — |
| `/children` | — | — | — | ● | — |
| `/team` | — | — | — | — | ● |
| `/stats` | — | — | — | — | ● |
| `/achievements` | ● | ● | — | — | ● |
| `/profile` | ● | ● | ● | ● | ● |
| `/admin/students` (+detalle) | ● | ● | ◐ | — | — |
| `/admin/teachers` (+detalle) | ● | ● | — | — | — |
| `/admin/categories` | ● | ● | ◐ | — | — |
| `/admin/categories/:id` | ● | ● | ● | — | — |
| `/admin/events` | ● | ● | ◐ | — | — |
| `/admin/venues` | ● | ● | — | — | — |
| `/admin/chat` + widget | ● | ● | — | — | — |
| `/settings/edit-academy` | ● | ● | — | — | — |
| `/settings/*` (resto) | ● | ● | ● | ● | ● |

● disponible · ◐ según su matriz de permisos · ○ no aplica · — bloqueado ·
⚠ accesible pero incorrecto (§3.3)

El profesor se rige por los seis permisos de `teacher_permissions`:
`can_take_attendance` abre Asistencias, `can_view_finances` abre Finanzas,
`can_manage_students` abre Alumnos, `can_manage_categories` abre Categorías y
`can_manage_events` abre la Agenda. `can_manage_payments` no abre una vista:
condiciona el botón de registrar pago dentro de Finanzas.

### Criticidad por frecuencia de uso

| Vista | Quién | Frecuencia real | Si falla… |
|---|---|---|---|
| Pase de lista | profesor | 5-15 veces/semana | se pierde el dato base de todo el producto |
| Inicio (padre/alumno) | padre, alumno | 2-5 veces/semana | el usuario final deja de abrir la app |
| Finanzas | admin | 1-2 veces/semana + cierre de mes | no hay cobranza |
| Alumnos | admin | diario al inicio, luego semanal | no se puede dar de alta |
| Agenda | admin | intensa al inicio de temporada | no hay sesiones que registrar |
| Categorías, Canchas | admin | configuración inicial, rara vez después | bloquea el arranque |
| Asistente IA | admin | exploratoria | se pierde el diferenciador |
| Ajustes | todos | 1-2 veces en la vida de la cuenta | fricción puntual |

---

## 1. Entrada y autenticación

### 1.1 `/login` — Acceso general
`pages/auth/LoginPage.tsx` · público

**Producto:** puerta de entrada para admin, profesor y padre. También es la
superficie de instalación de la PWA.

**Funciones**
- Autenticación con `supabase.auth.signInWithPassword` (sin pasar por la API).
- Redirección automática a `/` si ya hay sesión.
- Validación de correo y longitud mínima de 6 caracteres.
- Botón de instalación PWA bajo un separador "¿La usas a diario?".
- Enlaces a registro de academia y a acceso de alumno.

**Casos de uso cubiertos**
- *Dueño/profesor/padre entra a diario.*
- *Padre llega desde el móvil y se instala la app antes de iniciar sesión* — el
  botón está deliberadamente antes del login, que es la decisión correcta.

**Casos de uso NO cubiertos**
- *Olvidé mi contraseña.* No existe recuperación. Se convierte en soporte manual
  del dueño de la academia, que tampoco puede resolverlo desde el panel.
- *No sé a qué academia pertenezco.* Sin pista de contexto ni marca de la academia.
- Los errores de Supabase salen crudos y en inglés.

---

### 1.2 `/student-login` — Acceso de alumno
`pages/auth/StudentLoginPage.tsx` · público

**Producto:** entrada separada para menores que no tienen correo propio. Es una
decisión de producto acertada y poco frecuente en el sector.

**Funciones**
- `POST /auth/resolve-student` traduce `username` → correo interno.
- Con ese correo, autentica contra Supabase.

**Casos de uso cubiertos**
- *Niño de 10 años entra con usuario y contraseña* sin necesidad de correo.

**Casos de uso NO cubiertos y riesgo**
- *¿De dónde saco mi usuario?* No se muestra en ninguna vista de admin: el
  `username` existe por migración pero ninguna pantalla lo genera ni lo exhibe.
  El circuito está roto de punta a punta.
- `resolve-student` devuelve **correos de menores sin autenticación previa**: es
  un endpoint de enumeración.

---

### 1.3 `/register` — Alta de academia
`pages/auth/RegisterPage.tsx` · público

**Producto:** autoservicio de creación de tenant. Es el único punto de entrada
comercial del producto.

**Funciones**
- `POST /auth/register` con `schoolName`, `fullName`, `email`, `password`.
- Llamada con `axios` crudo, no con el cliente autenticado (correcto: no hay sesión).
- Redirección a `/login` tras 1.5 s.

**Casos de uso cubiertos**
- *Dueño crea su academia en menos de 10 minutos*, como promete el landing.

**Casos de uso NO cubiertos**
- No inicia sesión automáticamente ni lleva a configurar nada: entrega al usuario
  en un login en blanco.
- No captura tamaño de academia ni ciudad — el dato de segmentación más valioso,
  en el único momento en que el usuario está dispuesto a darlo.
- No hay aceptación explícita de términos ni de tratamiento de datos de menores.

---

### 1.4 `/accept-invite` — Activación por invitación
`pages/auth/AcceptInvitePage.tsx` · público (con token)

**Producto:** convierte un correo de invitación en una cuenta activa. Es el
mecanismo por el que entran profesores, padres y admins secundarios.

**Funciones**
- Verifica `token_hash` + `type` con `supabase.auth.verifyOtp` sin exponer el
  dominio de Supabase.
- Soporta el formato legacy con tokens en el hash (`#access_token`).
- Limpia la URL con `history.replaceState` tras verificar.
- Lee el perfil invitado (nombre, rol, academia) y lo muestra antes de pedir
  contraseña.
- Exige contraseña de 8 caracteres con confirmación.
- Estado explícito de enlace inválido o expirado, con salida a `/login`.

**Casos de uso cubiertos**
- *Profesor/padre recibe el correo y activa su cuenta viendo a qué academia y con
  qué rol entra.* Es la vista mejor resuelta de todo el bloque de autenticación.

**Casos de uso NO cubiertos**
- *El enlace expiró.* Se le dice "pide una nueva invitación", pero el admin **no
  tiene botón de reenviar** en `/admin/teachers`. Callejón sin salida compartido.
- Exige 8 caracteres aquí y 6 en `/change-password` y `/settings/security`.

---

### 1.5 `/change-password` — Cambio forzado
`pages/auth/ChangePasswordPage.tsx` · autenticado

**Producto:** compuerta de seguridad para usuarios con `must_change_password`.

**Funciones**
- `useChangePassword`: actualiza la contraseña vía cliente Supabase y luego avisa
  al backend con `PATCH /users/me/password-changed`.
- El comentario del hook documenta por qué no se usa el endpoint admin: revocaba
  la sesión y rompía el onboarding.
- `AuthGate` fuerza la redirección aquí hasta que se complete.

**Casos de uso cubiertos**
- *Usuario con contraseña temporal no puede navegar hasta cambiarla.*

**Casos de uso NO cubiertos**
- No hay medidor de fortaleza ni verificación contra la contraseña anterior.

---

### 1.6 `/onboarding` — Completar perfil
`pages/OnboardingPage.tsx` · profesor, padre, alumno

**Producto:** captura mínima de datos antes del primer uso.

**Funciones**
- `PATCH /users/me/profile` (nombre, apellido, teléfono).
- `POST /users/me/complete-onboarding` marca `onboarded_at`.
- `AuthGate` lo exige a profesor, padre y alumno.

**Casos de uso cubiertos**
- *Profesor invitado completa su nombre y teléfono antes de entrar.*

**Casos de uso NO cubiertos**
- **El admin no pasa por aquí.** `AuthGate` lo excluye explícitamente, así que el
  rol que paga es el único sin arranque guiado.
- Para el alumno no captura apodo, posición ni dorsal, pese a que
  `users.apodo`, `users.posicion` y `users.numero_favorito` existen y ninguna
  vista los usa.

---

## 2. Armazón de la aplicación

### 2.1 `AppShell` + `Sidebar` + `NotificationBell`
`components/layout/` · todos los roles autenticados

**Producto:** contenedor de navegación y notificaciones. No es una vista, pero es
la que más tiempo está en pantalla.

**Funciones**
- Cabecera con logo y nombre de la academia, indicador de "Sin conexión"
  (`useNetwork`), botón de instalación PWA (completo en escritorio, compacto en
  móvil), campana de notificaciones, interruptor de tema claro/oscuro y menú de
  usuario.
- Barra lateral en tres bloques (Principal / Administración / Ajustes), filtrada
  por rol, colapsable en móvil.
- Campana: `GET /notifications` con refetch cada 60 s, marcar una como leída,
  marcar todas, indicador de no leídas con tope en "9+".
- Montaje del `ChatProvider` y del widget flotante **solo si el rol es admin**.

**Casos de uso cubiertos**
- *Navegar entre módulos.* *Saber que estás sin conexión.* *Ver avisos de pago.*
- *Instalar la app en el teléfono* desde donde más ocurre.

**Casos de uso NO cubiertos**
- El sidebar tiene hasta 12 entradas sin jerarquía ni indicación de "empieza aquí".
- La campana no navega: al tocar una notificación solo se marca como leída, no
  lleva al pago ni a la sesión que la originó.
- No hay búsqueda global.

---

## 3. Vistas transversales

### 3.1 `/` — Inicio
`pages/DashboardPage.tsx` + 4 variantes · todos

**Producto:** cuatro productos distintos bajo una sola ruta. `DashboardPage`
saluda y despacha según rol.

#### Variante admin — `dashboard/AdminDashboard.tsx`
**Funciones:** `GET /dashboard/admin` → alumnos activos, total de alumnos,
ingreso mensual y tasa de asistencia; cuatro accesos directos (Alumnos,
Profesores, Categorías, Agenda).

**Caso de uso cubierto:** *"¿cómo va mi academia?"* en una ojeada.

**No cubiertos:** *"¿quién me debe y cuánto?"* (el adeudo solo existe dentro de
Finanzas → Pendientes), *"¿quién se está yendo?"*, *"¿qué pasa hoy?"*, y
cualquier tendencia — no hay una sola gráfica pese a tener `@mantine/charts` y
`recharts` instalados. Los importes se imprimen sin formato de moneda.

#### Variante profesor — `dashboard/TeacherDashboard.tsx`
**Funciones:** `GET /dashboard/profesor` (número de categorías, próxima sesión),
`GET /categories/mine`, `GET /events/trainings?date=hoy`.

**Caso de uso cubierto:** *"¿qué tengo hoy y qué grupos llevo?"*

**No cubiertos:** la tarjeta de la sesión de hoy **no lleva a pasar lista** —
el profesor tiene que ir al sidebar y repetir tres selecciones. El badge
"Completada" depende de un flag que ninguna vista escribe (§3.3).

#### Variante padre — `dashboard/ParentDashboard.tsx`
**Funciones:** `GET /dashboard/padre` (alerta de pago como cadena de texto),
`GET /students?parent_id=me`, tarjeta por hijo con atajos a asistencias y pagos.

**Caso de uso cubierto:** *"¿debo algo?"*

**No cubiertos:** *"¿cuándo entrena mi hijo?"* (prometido en el landing, ausente
aquí) y *"¿está yendo?"* — no muestra porcentaje de asistencia ni racha. Sin
esas dos cosas el padre no tiene motivo para abrir la app entre pagos.

#### Variante alumno — `dashboard/StudentDashboard.tsx`
**Funciones:** `GET /dashboard/alumno` → racha, sesiones del mes, logros,
categoría y próximo entrenamiento.

**Caso de uso cubierto:** *"¿cómo voy?"* Es la única vista del producto diseñada
para generar hábito.

**No cubiertos:** la racha no se celebra ni se compara con el equipo; no hay
tabla de posiciones de asistencia de la categoría; el alumno no ve su estado de
cuenta.

---

### 3.2 `/profile` — Mi cuenta
`pages/ProfilePage.tsx` · todos

**Producto:** índice de ajustes en formato lista móvil, más tarjeta de identidad
y cierre de sesión.

**Funciones:** muestra avatar, nombre, correo y rol; lista de siete destinos
filtrando "Datos de la academia" por rol admin; `signOut` que además limpia la
caché persistida para evitar fuga entre tenants.

**Caso de uso cubierto:** *"cambiar algo de mi cuenta"*, *"salir"*.

**No cubiertos:** duplica la navegación del sidebar con etiquetas distintas
("Academia" vs "Datos de la academia"). No hay eliminación de cuenta ni
descarga de datos personales.

---

## 4. Módulo de asistencias

### 4.1 `/attendance` — Pase de lista e histórico
`pages/AttendancePage.tsx` · **todos los roles** (sin restricción en la ruta)

**Producto:** dos productos en una ruta. `padre` recibe una vista de consulta;
**todo lo demás recibe la vista de captura**.

#### Fallo de alcance
`AttendancePage.tsx:38` enruta a la vista de consulta únicamente al rol `padre`.
La ruta no declara `roles` y `Sidebar.tsx:27` muestra la entrada a todos: un
**alumno entra a la pantalla de pase de lista** de la academia completa.

#### Pase de lista (admin / profesor)
**Funciones**
- Selector de categoría (`/categories/mine` para profesor, `/categories` para
  admin), selector de fecha y conmutador entrenamiento / partido.
- Carga de alumnos de la categoría y precarga de las marcas ya guardadas
  (`GET /attendances/category/:id?date=`).
- Interruptor Presente/Ausente por alumno.
- `POST /attendances` con el lote completo de registros.
- Tras guardar, dispara `POST /achievements/check` por cada alumno presente.
- Pestaña "Histórico" con el componente de historial por categoría.

**Casos de uso cubiertos**
- *Profesor registra la asistencia de su grupo.*
- *Admin corrige la lista de una fecha pasada.*
- *Admin revisa el histórico de un grupo.*

**Casos de uso NO cubiertos — es la vista con mayor fricción del producto**
- *Marcar todos presentes y desmarcar a los tres que faltaron.* No existe. Con
  asistencia típica del 85 %, son 20 toques en vez de 3.
- *Pasar lista sin señal en la cancha.* El service worker cachea solo GET; no hay
  cola de escritura. El guardado falla y se pierde el trabajo.
- *Entrar directo desde la sesión de hoy.* No hay vínculo con `trainings`: el
  usuario reintroduce a mano lo que el sistema ya sabe. Se puede pasar lista de
  una sesión cancelada sin advertencia.
- *Justificar una falta.* Solo existe presente/ausente binario.
- *Saber quién pasó lista y a qué hora.* `attendances.teacher_id` existe en el
  esquema y la vista no lo envía.
- Un refetch mientras el profesor marca **borra las marcas no guardadas**.

> **Conectado:** la vista localiza la sesión programada de esa categoría, fecha y
> tipo; manda su `training_id` con las asistencias, la cierra con
> `useMarkTrainingComplete` (lo que enciende el "Completada" del panel del
> profesor) y avisa cuando la sesión está cancelada.

#### Histórico por categoría — `components/attendance/CategoryAttendanceHistory.tsx`
**Funciones:** agrupa los registros por sesión (fecha + tipo), calcula porcentaje
por sesión, lo pinta con barra de progreso y semáforo (verde ≥70 %, amarillo
≥40 %, rojo), y despliega el detalle alumno por alumno ordenado alfabéticamente.

**Caso de uso cubierto:** *"¿cómo asistió el grupo el martes pasado?"*

**No cubierto:** *"¿qué alumno está faltando?"* — falta la vista por alumno
(matriz alumno × sesión con su porcentaje), que es la pregunta de negocio. No hay
filtro por rango ni exportación.

#### Consulta del padre
**Funciones:** selector de hijo y lista cronológica de tarjetas presente/ausente.

**No cubierto:** sin encabezado de porcentaje del mes ni racha. El padre no quiere
cuarenta tarjetas: quiere un número.

---

## 5. Módulo financiero

### 5.1 `/finances` — Finanzas
`pages/FinancesPage.tsx` · super_admin, admin, padre

**Producto:** dos productos en una ruta — libro de cobranza para el admin, estado
de cuenta para el padre.

#### Vista admin
**Funciones**
- Filtro por mes.
- Tres pestañas: Alumnos (`GET /payments?type=mensualidad&month=`), Profesores
  (`type=pago_profesor`) y Pendientes (`GET /payments/pending?month=`).
- Modal de registro de pago: alumno o profesor, monto, fecha, descripción y mes
  correspondiente → `POST /payments/students` o `POST /payments/teachers`.

**Casos de uso cubiertos**
- *Registrar el pago que acabo de recibir en efectivo.*
- *Ver quién pagó este mes.*
- *Pagar a un profesor y dejar registro.*

**Casos de uso NO cubiertos**
- *"¿Cuánto llevo cobrado y cuánto me falta?"* No hay totales en ninguna pestaña.
  Sumar a mano es exactamente lo que venías a eliminar del Excel.
- *"Voy a cobrarle a los que deben."* La pestaña Pendientes muestra **solo el
  nombre**: sin monto, sin meses de atraso, sin teléfono, sin botón de
  recordatorio por WhatsApp.
- *"Dame un recibo."* No hay comprobante de ningún tipo.
- *Pagos parciales, descuento por hermano, inscripción, uniforme.* El modelo solo
  admite `mensualidad` y `pago_profesor`, aunque los tipos del frontend declaran
  además `ingreso` y `egreso` que el `CHECK` de la tabla no acepta.
- Los meses se generan con `dayjs().month(i).format('MMMM')` y el proyecto **no
  importa el locale `es`**: el selector dice "January, February…".
- Importes sin formato de moneda en toda la vista.

#### Vista padre
**Funciones:** selector de hijo, `GET /payments/account-statement/:id` (cuota
mensual, adeudo, total pagado, al día sí/no) y listado de movimientos.

**Caso de uso cubierto:** *"¿estoy al corriente?"*

**No cubiertos:** historial mes a mes con los meses cubiertos marcados;
comprobante descargable; y, sobre todo, **pagar**. Ver la deuda sin poder
liquidarla es frustración pura.

---

## 6. Módulo de alumnos

### 6.1 `/admin/students` — Alumnos
`pages/admin/StudentsPage.tsx` · super_admin, admin, profesor

**Producto:** padrón de la academia. Es la tabla maestra de la que depende todo
lo demás.

**Funciones**
- Filtro por categoría (para profesor, solo sus categorías).
- Tabla con avatar, nombre, correo, categoría, estatus editable en línea,
  conmutador de uniforme y acciones de ver / editar / eliminar.
- Cambio de estatus en línea → `PATCH /students/:id/status`.
- Conmutador de uniforme → `PATCH /students/:id/uniform`.
- Modal de edición completo: nombre, nacimiento, categoría, tutor, teléfono,
  dirección, contacto de emergencia y notas médicas → `PUT /students/:id`.
- Eliminación con confirmación → `DELETE /students/:id` (archiva en
  `deleted_students`).
- Alta mediante el asistente de tres pasos.

**Casos de uso cubiertos**
- *Dar de alta un alumno nuevo.* *Corregir sus datos.* *Marcarle el uniforme.*
- *Cambiar su estatus a becado o inactivo.* *Darlo de baja.*

**Casos de uso NO cubiertos**
- *Buscar a un alumno por nombre.* **No hay buscador.** Solo filtro por categoría.
- *Trabajar con 300 alumnos.* Sin paginación ni virtualización: renderiza todos.
  El ICP declarado es 50-500 alumnos; esta pantalla no lo soporta en un teléfono.
- *Subir mi Excel.* No hay importación CSV. Cada cliente nuevo es captura manual.
- *Deshacer.* El estatus se guarda al primer toque, sin confirmación ni reversa.
- *Ver la papelera.* `useGetDeletedStudents` consume `/students/deleted` y
  **ninguna vista lo muestra**: hay papelera en el backend y no en la interfaz.
- El estatus ofrece `becado` y `pendiente_pago`; el `CHECK` de la tabla acepta
  `beca` y `pendiente`.
- `medical_notes` es un campo de una línea, y no se muestra al profesor en el
  pase de lista, que es el momento en que importa.

### 6.2 Asistente de alta — `pages/admin/components/StudentWizard.tsx`

**Producto:** alta guiada en tres pasos con resumen antes de confirmar.

**Funciones**
- Paso 1: nombre, fecha de nacimiento, correo y categoría, con validación.
- Paso 2: sin tutor / elegir existente / registrar nuevo. En el tercer caso,
  `POST /auth/invite-parent` y el `userId` devuelto se usa como `parent_id`.
- Paso 3: resumen de ambas tarjetas y confirmación → `POST /students`.
- Aviso explícito de que el tutor recibirá invitación por correo.

**Casos de uso cubiertos**
- *Alta de alumno con tutor nuevo, en un solo flujo, sin salir a otra pantalla.*
  Es el mejor flujo del producto.

**Casos de uso NO cubiertos**
- *Alumno de 8 años sin correo.* El correo es **obligatorio**: el dueño va a
  inventar direcciones. Debería ser opcional y generar en su lugar el `username`
  de acceso.
- *Entregar al padre el código de vinculación.* No se muestra nada al terminar,
  aunque `/children` pide exactamente ese código.
- *Dos tutores.* `parent_id` es una sola llave foránea.
- *Capturar una categoría entera.* No hay "guardar y crear otro".

### 6.3 `/admin/students/:id` — Ficha del alumno
`pages/admin/StudentDetailPage.tsx` · super_admin, admin, profesor

**Producto:** expediente deportivo del alumno. Es la vista que un padre pagaría
por ver.

**Funciones**
- Cabecera con avatar, correo, categoría, estatus y fecha de nacimiento.
- Cuatro métricas (`GET /students/:id/stats`): racha actual, racha máxima,
  asistidos/programados del mes y logros desbloqueados.
- Bloque de equipo (`GET /students/:id/team`): compañeros y profesores.
- Historial de asistencia (`GET /attendances/student/:id`), limitado a 50 filas.

**Casos de uso cubiertos**
- *"Este alumno, ¿cómo va?"* antes de hablar con su padre.

**Casos de uso NO cubiertos**
- *Llamar a su casa en una urgencia.* No muestra teléfono, dirección, contacto de
  emergencia ni notas médicas, aunque todos están en el modelo.
- *"¿Este que no paga, al menos viene?"* No muestra estado de cuenta: asistencia y
  dinero viven separados.
- *Editar desde aquí.* Hay que volver a la lista.
- El historial se corta en 50 filas sin aviso ni paginación.

---

## 7. Módulo de equipo

### 7.1 `/admin/teachers` — Profesores
`pages/admin/TeachersPage.tsx` · super_admin, admin

**Producto:** alta y directorio del personal.

**Funciones**
- Tabla de profesores (`GET /users?role=profesor`).
- Invitar profesor → `POST /auth/invite-teacher` con nombre y correo.
- Invitar administrador → `POST /auth/invite-admin`.
- Acceso al detalle.

**Casos de uso cubiertos**
- *Sumar un profesor o un segundo administrador al equipo.*

**Casos de uso NO cubiertos**
- *"¿Ya activó su cuenta?"* La tabla no distingue invitado de activo.
- *Reenviar o revocar una invitación.* No existe.
- *Dar de baja a un profesor que se fue a mitad de temporada.* **No se puede
  desactivar ni eliminar.** Conserva el acceso a los datos de la academia. Es un
  problema de seguridad, no de comodidad.
- *Editar sus datos.* `useUpdateUser` existe y ninguna vista lo usa.

### 7.2 `/admin/teachers/:id` — Detalle y permisos
`pages/admin/TeacherDetailPage.tsx` · super_admin, admin

**Producto:** control de acceso por profesor.

**Funciones**
- Ficha con avatar, correo y teléfono.
- Categorías asignadas, en solo lectura.
- Matriz de seis permisos (`GET /permissions/:id`) con interruptores y guardado
  en bloque (`PUT /permissions/:id`): tomar asistencia, gestionar eventos, ver
  finanzas, gestionar alumnos, gestionar pagos, gestionar categorías.

**Casos de uso cubiertos**
- *Definir qué puede hacer cada profesor.*

**Casos de uso NO cubiertos**
- *Asignar categorías desde aquí.* `useAssignTeacher`
  (`POST /categories/:id/teachers`) existe sin vista. Al invitar sí se pueden
  asignar; después del alta, no.
- *Plantillas de permisos* ("solo pase de lista", "coordinador").
- *Ver los pagos hechos a ese profesor* desde su ficha.
- Los cambios de permisos no quedan registrados.

---

## 8. Módulo de estructura deportiva

### 8.1 `/admin/categories` — Categorías
`pages/admin/CategoriesPage.tsx` · super_admin, admin

**Producto:** definición de los grupos de la academia.

**Funciones**
- Tabla con nombre, años de nacimiento, profesor responsable.
- Alta y edición: nombre, selección múltiple de años y profesor opcional →
  `POST /categories` / `PATCH /categories/:id`.

**Casos de uso cubiertos**
- *Crear Sub-12 y asignarle un profesor.*

**Casos de uso NO cubiertos**
- *Cambiar la cuota de una categoría existente.* El alta ya la fija; la edición
  sigue limitada a nombre, años y un profesor.
- *Cupo máximo y lista de espera.* *Archivar al terminar la temporada.*
- La edición sigue enviando `birth_year` como cadena `"2014-2015"` contra una
  columna `INTEGER`; el alta ya manda un entero.

> **Conectado:** el alta usa `useCreateFullCategory` (`POST /categories/full`)
> con `color`, `monthly_fee`, `teacher_ids[]`, `days[]`, `start_time`,
> `venue_id` y `recurrence_weeks`: cierra cuota, horario, varios profesores y
> generación de la temporada en un solo paso.

### 8.2 `/admin/categories/:id` — Detalle de categoría
`pages/admin/CategoryDetailPage.tsx` · super_admin, admin, profesor

**Producto:** panel del grupo, con sus tres dimensiones en pestañas.

**Funciones**
- Insignias de resumen: número de alumnos, profesor y cuota mensual.
- Pestaña Alumnos: tabla con estatus y acceso a la ficha.
- Pestaña Agenda: eventos base de la categoría.
- Pestaña Asistencias: el histórico agrupado por sesión.

**Casos de uso cubiertos**
- *Revisar un grupo completo sin saltar entre módulos.* Buena vista.

**Casos de uso NO cubiertos**
- *"¿Cómo va este grupo?"* Falta el porcentaje de asistencia agregado y el estado
  de cobranza del grupo, que es el resumen que un dueño quiere por categoría.
- Busca la categoría filtrando el listado completo en el cliente en lugar de
  pedirla por id.
- No se puede editar nada desde aquí.

### 8.3 `/admin/events` — Agenda
`pages/admin/EventsPage.tsx` · super_admin, admin

**Producto:** programación de entrenamientos y partidos.

**Funciones**
- Filtros de categoría y fecha.
- Pestaña "Día seleccionado": sesiones generadas de ese día
  (`GET /events/trainings?date=`), con cancelación por instancia
  (`POST /events/cancel`).
- Pestaña "Eventos base": eventos recurrentes, con borrado en cascada
  (`DELETE /events/:id`).
- Alta: nombre, categoría, fecha, hora, tipo, descripción, cancha y "repetir N
  semanas" → `POST /events`.

**Casos de uso cubiertos**
- *Programar el entrenamiento semanal de un grupo para toda la temporada.*
- *Cancelar la sesión del sábado por lluvia.*

**Casos de uso NO cubiertos**
- *Ver la semana.* Es una lista con selector de día: para armar una temporada hay
  que navegar fecha por fecha. Sin vista semanal no se detectan choques ni huecos.
- *"Martes y jueves".* La recurrencia es "cada N semanas"; no se eligen días.
  El esquema tiene `recurrence_rule jsonb` y `recurring_end_date` sin usar, y el
  landing promete quincenal y mensual.
- *Evitar que dos categorías choquen en la misma cancha.* No se valida.
- *Avisar de la cancelación.* El tipo `sesion_cancelada` ya existe en el `CHECK`
  de `notifications` y no se emite. El aviso que hoy se pierde en el grupo de
  WhatsApp está al 90 % construido.
- *Recordatorio previo a la sesión* (`sesion_recordatorio`, también sin usar).
- *Reprogramar una instancia.* Solo se puede cancelar. `useUpdateEvent` existe y
  ninguna vista lo usa: **un evento no se puede editar**.
- *Convocatoria para un partido* (qué alumnos van citados).
- **El profesor no entra.** La ruta es solo de admin, pese a existir el permiso
  `can_manage_events`.

### 8.4 `/admin/venues` — Canchas
`pages/admin/VenuesPage.tsx` · super_admin, admin

**Producto:** catálogo de sedes.

**Funciones**
- Tabla con nombre, dirección, superficie y capacidad.
- Alta y edición compartiendo formulario: nombre, dirección, superficie
  (natural / artificial / mixto / concreto / otro), capacidad, e interruptores de
  iluminación, techada y externa, más notas.
- Borrado con confirmación.

**Casos de uso cubiertos**
- *Registrar las canchas donde entrena la academia* y elegirlas al crear eventos.

**Casos de uso NO cubiertos y riesgo**
- El formulario envía `surface_type`, `has_lighting`, `is_covered` e
  `is_external`, y la tabla `venues` de `schema.sql` **no tiene esas columnas**
  ni hay migración que las agregue. Si el backend las descarta, el usuario cree
  que guardó datos que se perdieron.
- *"¿Cómo llego?"* Hay `latitud` y `longitud` en la tabla y ningún mapa ni enlace
  para el padre.
- *Costo de renta por cancha* — el principal egreso de una academia y el dato que
  falta para calcular rentabilidad por categoría.
- Borrar una cancha no avisa si hay eventos que la usan.

---

## 9. Vistas del alumno y del padre

### 9.1 `/team` — Mi equipo
`pages/TeamPage.tsx` · alumno

**Funciones:** `GET /students/:id/team` → nombre y color del equipo, año,
compañeros con avatar, profesores y horarios.

**Caso de uso cubierto:** *"¿quiénes son mis compañeros y cuándo entrenamos?"*

**No cubiertos:** foto de equipo, apodo y dorsal (campos existentes sin usar), y
cualquier elemento social. Los horarios dependen de que el backend los devuelva;
no hay vista que los defina (§8.1).

### 9.2 `/stats` — Mis estadísticas
`pages/StatsPage.tsx` · alumno

**Funciones:** cuatro métricas (racha actual, racha máxima, asistidos/programados
del mes, logros) y tabla de asistencias limitada a 50 filas.

**Caso de uso cubierto:** *"¿cómo voy este mes?"*

**No cubiertos:** **ni una sola gráfica**, teniendo las librerías instaladas. Una
línea de asistencia mensual y un calendario tipo mapa de calor cambiarían por
completo la percepción de la pantalla. Nada comparable con el grupo.

### 9.3 `/achievements` — Logros
`pages/AchievementsPage.tsx` · alumno, admin, super_admin

**Funciones:** `GET /achievements` → cuadrícula de logros con los bloqueados en
opacidad reducida y candado, contador "X de Y" y fecha de desbloqueo.

**Caso de uso cubierto:** *"¿qué he conseguido?"*

**No cubiertos:** progreso parcial por logro ("7 de 10 asistencias"), que es lo
que convierte un logro en motivación. El desbloqueo ocurre en silencio:
`POST /achievements/check` se dispara al guardar asistencias y el alumno se
entera solo si entra a mirar. El esquema define logros de tipo `goles` y
`puntualidad` y el producto no captura goles ni hora de llegada: hay logros
imposibles de desbloquear. El admin ve esta vista pero no puede crear ni editar
logros.

### 9.4 `/children` — Mis hijos
`pages/ChildrenPage.tsx` · padre

**Funciones:** lista de hijos con avatar, categoría y estatus; vinculación
(`POST /parents/link-child`) por código de alumno **o por nombre completo**;
desvinculación con confirmación (`DELETE /parents/children/:id`).

**Caso de uso cubierto:** *"ver a mis hijos y entrar a su información"*.

**Casos de uso NO cubiertos y riesgo**
- **Vinculación por nombre completo.** Si el backend no exige verificación,
  cualquier padre registrado puede vincularse a cualquier menor escribiendo su
  nombre y acceder a sus asistencias, su estado de cuenta y sus datos. Debe
  verificarse de inmediato.
- El "código del alumno" que pide el formulario **no se genera ni se muestra en
  ninguna vista de admin**: el flujo está desconectado de punta a punta.
- No hay aprobación de solicitudes del lado del administrador.
- `useGetMyChildrenFull` (`GET /parents/me/children`) existe y no se usa: la
  vista tira de `/students?parent_id=me`.

---

## 10. Ajustes

| Vista | Funciones | Veredicto |
|---|---|---|
| `/settings/edit-academy` | Nombre y logo de la academia, con subida a `POST /upload/logo` y `PUT /schools/:id`. | Correcta. Le falta razón social, dirección y correo de contacto, que ya existen en la tabla `schools`. |
| `/settings/edit-profile` | Nombre, teléfono, dirección, contacto de emergencia y avatar → `PATCH /users/me/profile` + `POST /upload/avatar`. | Correcta. Expone un campo "URL de avatar" en crudo junto al botón de subida. |
| `/settings/security` | Cambio de contraseña. | Correcta. Exige 6 caracteres frente a los 8 de la invitación. |
| `/settings/notifications` | Tres interruptores sobre `useState` local. | **Pantalla falsa.** No persiste nada y se reinicia al recargar. El usuario cree que desactivó algo y sigue recibiendo avisos. Quitarla o conectarla. |
| `/settings/export` | Cuatro descargas CSV generadas en el cliente desde `/export/payments`, `/export/attendance`, `/students` y `/categories`. | Entrega menos de lo prometido (el landing dice PDF y Excel), sin selección de rango, y muestra vocabulario de implementación al usuario ("generado en cliente"). |
| `/settings/support` | Formulario que arma un `mailto:`. | **Se pierde el mensaje** si no hay cliente de correo configurado — el caso normal en Android con Gmail web. Debería guardarse en el backend: además es tu canal de feedback de beta. |
| `/settings/terms` | Términos en duro dentro del componente. | Sin fecha de versión ni aviso de privacidad separado. Con datos de menores mexicanos, el aviso formal no es opcional. El contacto apunta a `soporte@futcamedic.com`, otra marca. |

---

## 11. Asistente IA

### 11.1 `/admin/chat` y widget flotante
`pages/admin/ChatPage.tsx`, `components/chat/*`, `contexts/ChatContext.tsx` ·
super_admin, admin

**Producto:** agente conversacional con acceso de lectura y escritura a los datos
de la academia. Es el mayor diferenciador frente a una hoja de cálculo y la pieza
mejor construida del código.

**Funciones**
- Streaming SSE propio (`api/chatStream.ts`): `fetch` + `ReadableStream` con
  parseo manual, porque `EventSource` no admite POST ni cabecera de autorización.
- Eventos: `conversation`, `text_delta`, `tool_start`, `tool_end`,
  `confirmation_required`, `done`, `error`, más latidos.
- Estado único en `ChatProvider`, montado por encima del `AppShell`: la página y
  el widget comparten conversación y stream, que sobreviven a la navegación.
- Lista de conversaciones, selección, borrado y creación.
- Actividad de herramienta visible en vivo mientras el agente trabaja.
- **Tarjeta de confirmación antes de ejecutar acciones**, con el detalle de los
  parámetros y botón rojo si el nombre de la herramienta empieza por `delete_`.
- Estado `awaiting_confirmation` persistido en el servidor: al recargar o cambiar
  de conversación, la confirmación pendiente se recupera.
- Widget flotante con punto rojo cuando hay una confirmación esperando.
- Tres sugerencias fijas al abrir una conversación vacía.
- Entrada bloqueada mientras hay stream o confirmación pendiente.
- Aborto del stream al cambiar de conversación o desmontar.

**Casos de uso cubiertos**
- *"¿Cómo va la academia este mes?"* — consulta en lenguaje natural.
- *"¿Quién debe la mensualidad?"* — atraviesa módulos sin navegar.
- *Crear alumnos, programar eventos o registrar asistencias por conversación*,
  con confirmación explícita antes de escribir.

**Casos de uso NO cubiertos**
- *El profesor pregunta "¿quién faltó la semana pasada en Sub-12?"* y *el padre
  pregunta "¿cuándo entrena mi hijo?"*: los dos casos de mayor frecuencia están
  fuera. El asistente es exclusivo de admin.
- *"¿Qué hizo el asistente la semana pasada?"* No hay registro de acciones
  ejecutadas. Para un agente con permisos de escritura, eso es obligatorio.
- **No hay límite de uso ni medición de costo por academia.** Cada conversación
  cuesta dinero real y hoy nadie lo mide: antes de abrirlo a más roles hay que
  instrumentarlo o se come el margen.
- Las sugerencias son fijas; deberían depender del estado real de la academia
  ("tienes 8 pagos pendientes, ¿los reviso?").
- Está escondido como una entrada más entre once del sidebar.

---

## 12. Capacidad construida sin interfaz

Este es el hallazgo más accionable del inventario: **hay funciones ya
implementadas en el backend y con hook escrito en el frontend que ninguna vista
invoca.** No es trabajo por hacer, es trabajo por conectar.

### Ya conectado (23 de octubre de 2026)

| Hook / endpoint | Dónde quedó conectado |
|---|---|
| `useGetMyPermissions` → `GET /permissions/mine` | `useMyPermissionGate` en `hooks/usePermissions.ts`, consumido por `Sidebar` y por `ProtectedRoute` mediante la prop `permission`. Los 6 permisos ya filtran menú y rutas. |
| `useCreateFullCategory` → `POST /categories/full` | Alta en `CategoriesPage`: cuota mensual, color, varios profesores, días, hora, cancha y generación de la temporada. |
| `useInviteTeacher` con `categoryIds` + `permissions` | Modal de invitación en `TeachersPage`: categorías a su cargo y matriz de permisos desde el alta. |
| `useMarkTrainingComplete` + `training_id` en `POST /attendances` | `AttendancePage` ata las asistencias a la sesión programada y la cierra al guardar. |

### Pendiente de conectar

| Hook / endpoint | Qué habilita | Hueco de producto que cierra |
|---|---|---|
| `useAssignTeacher` → `POST /categories/:id/teachers` | Asignar profesores a una categoría existente | Segundo profesor / auxiliar técnico después del alta |
| `useGetDeletedStudents` → `GET /students/deleted` | Papelera de alumnos | Recuperar una baja por error |
| `useUpdateUser` → `PUT /users/:id` | Editar datos de un profesor | Mantenimiento del personal |
| `useUpdateEvent` → `PUT /events/:id` | Editar un evento | Reprogramar en vez de borrar y recrear |
| `useGetTrainingsByEvent` → `GET /events/:id/trainings` | Ver las sesiones generadas por un evento | Previsualizar la temporada antes de confirmar |
| `useGetMyChildrenFull` → `GET /parents/me/children` | Datos ampliados de los hijos | Panel del padre más rico |
| `@mantine/charts` + `recharts` (instalados) | Gráficas | Cero gráficas en todo el producto |
| `EmptyState` con prop `action` | Estado vacío accionable | Usado ya en Categorías; faltan las otras 28 vistas |
| Tipos `sesion_cancelada` y `sesion_recordatorio` en `notifications` | Avisos de agenda | El dolor del grupo de WhatsApp, sin resolver |
| `users.apodo`, `posicion`, `numero_favorito` | Identidad del jugador | Gamificación ya pagada en el esquema |
| `venues.latitud` / `longitud` | Mapa y "cómo llegar" | Valor directo para el padre |
| `PATCH /categories/:id` con `monthly_fee` (sin verificar) | Editar la cuota de una categoría existente | Hoy la cuota solo se puede fijar al crear |

---

## 13. Resumen de cobertura

| Módulo | Casos de uso cubiertos | Hueco principal |
|---|---|---|
| Autenticación | Alta, invitación, acceso diferenciado por rol | Sin recuperación de contraseña |
| Arranque | Perfil de profesor, padre y alumno | **El admin no tiene arranque guiado** |
| Inicio | Resumen por rol | Sin acción, sin tendencia, sin alerta de fuga |
| Asistencias | Captura y consulta | Sin marcar todos, sin offline, sin vínculo con la sesión |
| Finanzas | Registro y estado de cuenta | Sin totales, sin cobranza, sin recibo, sin pagar |
| Alumnos | Padrón completo y expediente | Sin buscador, sin paginación, sin importación |
| Equipo | Invitación con categorías y permisos, matriz aplicada en la UI | No hay baja de profesor ni reenvío de invitación |
| Estructura | Categorías con cuota y horario, agenda y canchas | Sin calendario, sin editar cuota ya creada |
| Alumno/padre | Equipo, estadísticas, logros, hijos | Sin gráficas, sin celebración, riesgo en la vinculación |
| Ajustes | Perfil, academia, seguridad, exportación | Notificaciones falsas, soporte que se pierde |
| Asistente IA | Consulta y acción conversacional con confirmación | Solo admin, sin medición de costo, sin auditoría |
