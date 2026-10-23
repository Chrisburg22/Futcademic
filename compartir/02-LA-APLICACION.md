# La aplicación

## Para quién es

El **propietario o director de una academia de futbol** que hoy lleva asistencia en cuadernos, programación en WhatsApp, cobro en efectivo y registros en hojas de cálculo. Futcademic reúne todo eso en una sola aplicación, usable desde el teléfono.

## Roles

Cada persona entra con uno de cinco roles y ve solo lo que le corresponde.

| Rol | Quién es | Qué puede hacer |
|---|---|---|
| `super_admin` | Administrador de la plataforma | Todo, en cualquier academia. |
| `admin` | Dueño o director de la academia | Gestiona alumnos, profesores, categorías, eventos, sedes, pagos y ajustes de su academia. |
| `profesor` | Entrenador | Pasa lista y consulta alumnos de sus categorías; el admin le concede o quita permisos (alumnos, eventos, finanzas, pagos, asistencia, categorías). |
| `padre` | Tutor de uno o varios alumnos | Ve a sus hijos, su asistencia, su estado de cuenta y las notificaciones. |
| `alumno` | El jugador | Ve sus entrenamientos, sus estadísticas y sus logros. |

## Qué se hace con ella

### Alumnos y categorías
- Alta de alumnos con categoría (por año de nacimiento), tutor, contacto de emergencia y notas médicas.
- Estatus del alumno: `activo`, `beca`, `pendiente`, `inactivo`.
- Control del uniforme entregado.
- **Baja con memoria:** al dar de baja a un alumno no se borra; se conserva en una tabla aparte con fecha y quién la ejecutó.
- Cada categoría tiene su cuota mensual y puede tener uno o varios profesores asignados.

### Agenda y sesiones
- Eventos de tipo *entrenamiento* o *partido*, con fecha, hora, sede y recurrencia semanal.
- Cada ocurrencia de un evento recurrente se materializa como una **sesión** concreta; una sesión puede cancelarse sin borrar el evento.
- Catálogo de sedes (canchas) con dirección, capacidad y coordenadas.

### Asistencia
- El profesor pasa lista desde la app móvil, sesión por sesión.
- El sistema calcula la **racha** de cada alumno (actual y máxima) y la fecha de su última asistencia.

### Finanzas
- Registro de **mensualidades** por alumno (con mes y año de aplicación) y de **pagos a profesores**.
- Registro en bloque, estado de cuenta por alumno y lista de pagos pendientes.
- Reportes exportables.

### Logros y notificaciones
- Logros por racha, asistencias, goles, puntualidad o progreso.
- Notificaciones a padres y alumnos: pago recibido, recordatorio de sesión, sesión cancelada, bienvenida, logro desbloqueado.

### Asistente de IA (solo web, rol admin)
Un chat que entiende peticiones en lenguaje natural y ejecuta acciones reales sobre la academia: consultar el resumen, listar alumnos, ver pagos pendientes, crear alumnos, categorías o eventos, registrar pagos, pasar lista o cancelar una sesión. **Las acciones que modifican datos piden confirmación** antes de ejecutarse.

## Dónde se usa

### Panel web (administración)
Inicio con resumen (alumnos activos, total, ingreso del mes, asistencia del día), asistencias, finanzas, alumnos, profesores, categorías, agenda, canchas, asistente de IA y ajustes de la academia (perfil, seguridad, notificaciones, exportar, soporte).

El panel es una **PWA instalable**: se puede añadir a la pantalla de inicio y conserva en caché los últimos datos vistos para mostrarlos sin conexión.

### App móvil (iOS y Android)
Pantallas distintas según el rol:
- **Administrador:** alumnos, profesores, categorías, eventos, sedes, finanzas, asistencia, invitaciones y permisos de profesores.
- **Profesor:** sus categorías y alumnos, pase de lista, historial y eventos.
- **Padre:** sus hijos, estado de cuenta, eventos, notificaciones y una vista sin conexión.
- **Alumno:** entrenamientos, estadísticas y logros.

## Cómo entra la gente

- El propietario **registra su academia** y recibe confirmación por correo.
- A profesores, padres y administradores adicionales se les **invita por correo** con una contraseña temporal que deben cambiar al primer ingreso.
- Los alumnos pueden tener su propio acceso.
