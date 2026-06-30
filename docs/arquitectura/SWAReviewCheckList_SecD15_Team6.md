# SWA Review Document — Futcamedic

**Sección:** D15 · **Equipo:** 6 · **Término:** 2026
**Documento:** SWAReviewCheckList_SecD15_Team6

## Summary

| Campo | Valor |
|---|---|
| Date | 22-Apr-2026 |
| Effort | 4 h (equipo) |
| Room/Location | TEC — Remote (Google Meet) |
| Review Status | Closed |
| Review name | `SWA_Futcamedic_SecD15_Team6.docx` |
| Method | WT (Walk-Through) |
| Release | 1.0 |
| Responsible | Christian A. Ramos Pérez |
| Project | Futcamedic |
| Reason of Review | Release P03 — revisión del documento SW Architecture contra requisitos P01/P02 y contra el código actual del repo. |

## Comment List

| No. | Reference | Comments / Actions | Classification (E)rror/Risk / (R)emark | Responsible / Planned date | Completion (Name/Date) |
|---|---|---|---|---|---|
| 1 | SWA §5.6.1 | No existe rate-limit documentado para `POST /api/auth/register`; anotar en el plan de hardening post-release. | R | Christian — 06-May-2026 | Abierto |
| 2 | SWA §4 | Política RLS de `super_admin` comentada en `schema.sql:212`; confirmar si se deja out-of-scope P03 o se implementa. | R | Equipo — 29-Apr-2026 | Cerrado — out-of-scope P03 |
| 3 | SWA §6.2 `swcEventController` | `fnCreateEvent` no valida un cap superior en `recurringWeeks`; riesgo de insert masivo. | E | Christian — 29-Apr-2026 | Cerrado — cap 52 añadido en backlog |
| 4 | SWA §5.3 diagrama | Agregar leyenda explícita de `anon key` vs `service_role key` para lector no-técnico. | R | Christian — 22-Apr-2026 | Cerrado |
| 5 | SWA §6.6.3 Power Modes | Documentar qué pasa con la sesión si el refresh_token expira mientras app está en background >24 h. | R | Christian — 06-May-2026 | Abierto |
| 6 | SWA §9 Integration Plan | Añadir paso 0 de creación de proyecto Supabase + ENV vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EXPO_PUBLIC_*`). | R | Christian — 22-Apr-2026 | Cerrado |

## Check List

| No. | Description | OK / NOK / NR | Comment | Responsible / Planned date | Status |
|---|---|---|---|---|---|
| 1 | Does the design comply to the SW Requirements? | OK | Todos los requisitos P01/P02 están cubiertos por las funciones listadas en §5.1 y §5.2. | Christian — 22-Apr-2026 | Closed |
| 2 | Are all requirements allocated to Architectural elements? | OK | Tabla §7 Function-to-Physical Allocation mapea 1:N fn→swc. | Christian — 22-Apr-2026 | Closed |
| 3 | Is the system context (environment) of the software architecture described? | OK | §5.3 component diagram muestra Mobile ↔ API ↔ Supabase Auth + Postgres. | Christian — 22-Apr-2026 | Closed |
| 4 | Is a global overview of all SW function blocks and SW components provided? | OK | §5.1 tabla de 36 funciones + §6.2 tabla de 18 SWCs. | Christian — 22-Apr-2026 | Closed |
| 5 | Are the functions identified from SW requirements and reviewed there are no missing functions? | OK | Checklist P01 cruzado contra §5.1; sin huecos. | Equipo — 22-Apr-2026 | Closed |
| 6 | Are the functional interfaces documented? | OK | §5.2 describe 9 interfaces (iAuthToken, iTenantContext, etc.). | Christian — 22-Apr-2026 | Closed |
| 7 | Is each SW function mapped to one or more SW components? | OK | §7 cubre los 36 `fn*` a los 18 `swc*`. | Christian — 22-Apr-2026 | Closed |
| 8 | Do SW components' interfaces export only the needed data and functions (encapsulation principle)? | OK | `supabaseAdmin` (service_role) sólo se expone al backend; mobile usa únicamente anon key + RLS. | Christian — 22-Apr-2026 | Closed |
| 9 | Are diagrams (use case, sequence, class) used were appropriate? | OK | §5.3 componentes, §5.4 clases, §6.1 paquetes, §6.5 secuencia (login + asistencia). | Christian — 22-Apr-2026 | Closed |
| 10 | Are the SW components identified? | OK | §6.2 tabla con 18 SWCs y tamaño estimado en KB. | Christian — 22-Apr-2026 | Closed |
| 11 | Are the Physical Interfaces identified with a clear usage description? | OK | §6.3 tabla + §6.4 árbol de archivos/métodos por componente. | Christian — 22-Apr-2026 | Closed |
| 12 | Are the OS tasks properly defined and documented? | NR | No aplica: Node.js serverless + React Native JS. Event-driven; se documentan tareas periódicas equivalentes en §6.6.1. | Christian — 22-Apr-2026 | Closed |
| 13 | Are the Interrupt usage described? | NR | No aplica: no hay ISRs. Se documentan los equivalentes (onAuthStateChange, AppState change, 401 handler) en §6.6.2. | Christian — 22-Apr-2026 | Closed |
| 14 | Are there Power Modes identified and documented? | OK (parcial) | §6.6.3 documenta FG/BG en mobile y cold-start serverless. Pendiente BG >24h (Comment 5). | Christian — 06-May-2026 | Open |
| 15 | Is the integration Plan properly described with the corresponding order for the software construction? | OK | §9 detalla 10 pasos numerados con SWCs y dependencias. | Christian — 22-Apr-2026 | Closed |
| 16 | Is the functional safety information properly described on the SWA document? | OK | §6.7 Synchronization + §4 Constraints cubren RLS, RBAC, JWT, UNIQUE constraints, refresh rotation. | Christian — 22-Apr-2026 | Closed |

## Conclusion

- Total items: 16
- OK: 13
- OK (parcial) / Open: 1 (item 14)
- NR: 2 (items 12, 13 — justificados por el stack no-RTOS)
- NOK: 0

**Veredicto del equipo:** SW Architecture aprobada para release 1.0 con 2 comentarios abiertos de bajo riesgo (rate-limit documentation y background >24h session handling) programados para 06-May-2026.
