---
title: "Futcamedic"
subtitle: "Plataforma Multi-Tenant para Gestión de Academias de Fútbol"
date: "5 de mayo de 2026"
author:
  - name: "Equipo de Producto"
    affiliation: "Futcamedic"
---

## Definición del Producto: Futcamedic

### Definición en Una Frase
Una aplicación web y móvil donde propietarios de academias de fútbol inician sesión para gestionar alumnos, registrar asistencias, cobrar pagos y programar sesiones de entrenamiento en múltiples categorías y sedes.

### Tipo de Producto
**Herramienta (Tool)** — Los usuarios acceden al software mediante una aplicación web o móvil y realizan operaciones diarias.

### El Comprador
- **Quién**: Propietario o director de academia de fútbol, gestionando 50-500 alumnos en 4-12 categorías, empleando 5-20 profesores, operando en 1-5 sedes
- **Antes**: Usaba cuadernos de papel para asistencias, grupos de WhatsApp para programación, cobro manual en efectivo, hojas de cálculo Excel para registros de alumnos, llamadas telefónicas para notificar a padres
- **Después (Día 30)**: Inicia sesión en un dashboard unificado desde su teléfono, ve tasas de asistencia en tiempo real, estado de pagos de todos los alumnos, próximas sesiones de entrenamiento y envía notificaciones push automáticas a padres — todo desde un teléfono móvil

### Experiencia del Día 1
1. Propietario registra su escuela en `/register` con nombre de la escuela, nombre completo, email, contraseña
2. Recibe email de confirmación de Supabase Auth
3. Inicia sesión en `/login` con credenciales
4. Cambia contraseña temporal (si fue invitado) o continúa directo (si es propietario)
5. Crea su primera categoría (ej. "U-12") seleccionando rango de año de nacimiento
6. Invita a su primer profesor vía email (sistema envía invitación con contraseña temporal)
7. Agrega sus primeros 5-10 alumnos a la categoría con información de contacto del padre
8. Programa su primera sesión de entrenamiento con fecha, hora, sede y categoría

### Qué Reciben
- **Acceso web**: Aplicación React web en `web/` con capacidades completas de administración
- **Acceso móvil**: Aplicación Expo React Native para iOS/Android con pestañas basadas en rol
- **Aislamiento multi-tenant**: Datos de cada escuela completamente separados vía `school_id`
- **Notificaciones push**: Alertas automáticas a padres cuando se registran pagos
- **Almacenamiento**: Bucket de Supabase Storage para fotos de perfil de alumnos
- **Capacidades de exportación**: Reportes en PDF y Excel para pagos y asistencias

### Qué NO Tienen Que Hacer
- Calcular porcentajes de asistencia manualmente (el sistema lo calcula automáticamente)
- Enviar recordatorios de pago individuales (registro en bloque con notificación automática)
- Rastrear qué profesor gestiona qué categoría (el sistema asigna y filtra)
- Preocuparse por que otras escuelas vean sus datos (RLS impone aislamiento)
- Construir eventos recurrentes manualmente cada semana (motor de recurrencia genera sesiones)

### Qué Todavía Tienen Que Hacer
- Ingresar datos de alumnos manualmente (aún no hay importación masiva CSV)
- Cobrar efectivo/transferencias fuera del sistema (registro de pago es entrada manual)
- Verificar toma de asistencia por parte del profesor (no hay validación GPS/ubicación)
- Gestionar comunicaciones con padres más allá de notificaciones de pago
- Manejar emergencias médicas de alumnos (el sistema almacena información pero no alerta)

### Estado de Evidencia

| Afirmación | Evidencia | Estado |
|------------|----------|--------|
| Los usuarios pueden registrar una escuela y comenzar a usar el sistema en 10 minutos | Revisión de código de flujo de registro `auth.controller.ts` + `register.tsx` | Verificado |
| Los profesores solo pueden tomar asistencias para sus categorías asignadas | Middleware `requireTenant` + filtro de categoría en `attendance.controller.ts` | Verificado |
| Los padres solo ven los datos de sus propios hijos | Filtro de padre en `student.controller.ts` + políticas RLS | Verificado |
| El registro de pagos envía notificaciones push a padres | `payment.controller.ts` llama a `sendPushNotification` | Verificado |
| Eventos recurrentes generan múltiples sesiones de entrenamiento | Lógica de recurrencia en `event.controller.ts` (semanal, quincenal, mensual) | Verificado |

### Preguntas Abiertas
- ¿Cómo maneja la academia las fallas en la entrega de notificaciones push?
- ¿Qué sucede cuando un profesor es removido de una categoría a mitad de temporada?
- ¿Es necesario generar comprobante de pago en PDF con logo de la academia?
- ¿Debería el sistema soportar múltiples contactos de padres por alumno?
- ¿Cuál es la tasa de abandono esperada después de 90 días?
