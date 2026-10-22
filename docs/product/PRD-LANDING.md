---
title: "PRD — Landing Page Futcamedic"
subtitle: "Sitio público de adquisición self-serve"
date: "21 de octubre de 2026"
author:
  - name: "Equipo de Producto"
    affiliation: "Futcamedic"
---

# PRD: Landing Page Futcamedic

## Decisiones tomadas (entrada del Product Owner)

| Decisión | Valor | Consecuencia para el landing |
|----------|-------|------------------------------|
| Conversión | Registro self-serve → `/register` del panel web | No hay formulario de contacto, no hay agenda de demo. Todo el sitio empuja a un solo botón. |
| Precio | No definido aún | No hay sección de planes. Hay que decir **explícitamente** qué paga el visitante al registrarse. |
| Evidencia de clientes | Ninguna academia real usándolo | Prohibido testimonios, logos y métricas de clientes. La prueba es el producto mismo. |
| Ubicación | Proyecto Astro independiente | Sitio estático aparte del panel (Vite + Mantine). Deploy propio en Vercel. |

---

## Problem Statement

El dueño de una academia de fútbol con 50-500 alumnos administra su operación con cuadernos de asistencia, grupos de WhatsApp, cobro en efectivo y hojas de Excel. No sabe cuánto le deben hoy, no sabe qué alumno lleva tres semanas faltando, y los padres se enteran de todo por mensajes sueltos. Cuando busca una solución, encuentra ERPs genéricos caros o software deportivo en inglés pensado para ligas, no para academias. Necesita ver en treinta segundos que existe una herramienta en español, hecha para su caso exacto, en la que puede abrir una cuenta hoy sin hablar con un vendedor.

Hoy no existe ninguna página pública de Futcamedic. El panel web vive detrás de `/login` y no hay URL que se pueda compartir, mandar por WhatsApp o indexar.

---

## El conflicto que hay que resolver antes de escribir una línea

**Self-serve + sin precio publicado = el visitante da clic sin saber qué va a pagar.**

Esto rompe la conversión y, peor, rompe la confianza en el primer cobro. No se puede dejar en silencio. Hay exactamente tres salidas honestas:

1. **Beta gratuita declarada.** El landing dice: "Gratis durante la beta. Te avisamos con 30 días de anticipación antes de cobrar." Es verdadero hoy, elimina la fricción y compra tiempo para definir precio con usuarios reales dentro.
2. **Precio provisional.** Publicas una cifra aunque no sea definitiva. Filtra mejor, pero no hay datos aún para sostenerla.
3. **Silencio.** El visitante se registra sin saber. Rechazada: genera churn y reclamos en el primer mes.

**Recomendación: opción 1.** El resto de este PRD la asume. Si se cambia, cambia el hero, el CTA y la sección final.

---

## Success Criteria

Métricas del sitio durante los primeros 60 días desde publicación:

1. **≥ 8%** de visitantes únicos dan clic en el CTA principal hacia `/register`.
2. **≥ 40%** de los que llegan a `/register` desde el landing completan el alta de escuela (crean cuenta y confirman email).
3. **≥ 3** escuelas registradas con al menos 1 categoría y 5 alumnos creados — la primera señal real de producto usado, no solo firmado.
4. **≤ 2.0 s** Largest Contentful Paint en 4G móvil y **≥ 95** en Lighthouse Performance y Accessibility.
5. **≥ 60%** del tráfico atendido correctamente en móvil (el comprador revisa esto desde la cancha, no desde escritorio).

Si (1) se cumple y (2) no, el problema es el onboarding, no el landing. Si (1) no se cumple, el problema es el mensaje.

---

## Customer Stories

- Como **dueño de academia** que recibe el link por WhatsApp, necesito entender en 30 segundos qué hace el sistema y para quién es, para decidir si sigo leyendo o cierro.
- Como **dueño de academia** desconfiado de software nuevo, necesito ver pantallas reales del producto funcionando, para creer que existe y no es una promesa.
- Como **dueño de academia**, necesito saber cuánto cuesta antes de dar mis datos, para no sentir que me están emboscando.
- Como **dueño de academia** convencido, necesito un botón que me lleve directo a crear mi escuela, para empezar hoy sin esperar a que alguien me llame.
- Como **profesor o padre** que recibió el link por error, necesito entender rápido que esto lo contrata la academia y que yo entro por invitación, para no crear una cuenta equivocada.
- Como **dueño de academia** en móvil, necesito que la página cargue rápido y se lea bien en pantalla chica, porque la abro entre entrenamientos.

---

## In Scope

Secciones de la página, en orden:

1. **Hero** — Qué es, para quién, y el CTA primario a `/register`. Incluye la línea de precio-beta de forma visible, no en letra chica.
2. **El antes** — Los cuatro dolores concretos: cuaderno de asistencia, Excel de alumnos, cobro en efectivo sin control, WhatsApp como sistema de avisos. Nombrados tal cual, sin eufemismos.
3. **Los cuatro módulos** — Alumnos y categorías · Asistencias · Pagos · Eventos y entrenamientos. Cada uno con una captura real del panel.
4. **Qué ve cada rol** — Admin, profesor, padre, alumno. Es un diferenciador real frente a Excel y hay que mostrarlo.
5. **Demo en video** — Reutiliza los videos ya existentes en `docs/videos/` (crear alumno, login alumno, pase de lista, módulo alumno, eventos).
6. **Prueba sin clientes** — Lo que sí es verdadero hoy: aislamiento multi-tenant por escuela, funciona instalado como app en el teléfono (PWA), exportación a PDF y Excel, notificaciones automáticas a padres al registrar un pago.
7. **Límites honestos** — Qué todavía no hace: no hay importación masiva CSV, no procesa cobros en línea, no valida ubicación del profesor al pasar lista. Esta sección existe para filtrar a quien se iría en la semana 2.
8. **FAQ** — Precio durante beta, qué pasa con mis datos, cómo entran profesores y padres, si funciona en Android/iOS, qué necesito para empezar.
9. **CTA final** — Mismo destino que el hero, repetido.
10. **Footer** — Aviso de privacidad, contacto, enlace a `/login` para quien ya tiene cuenta.

Requisitos técnicos:

11. Proyecto Astro nuevo en el workspace, independiente de `web/` y `backend/`.
12. Sitio 100% estático, sin JavaScript de cliente salvo lo mínimo (menú móvil). Sin dependencia de Supabase ni del backend.
13. URL del panel configurable por variable de entorno (`PUBLIC_APP_URL`), no escrita a mano en el código.
14. Español de México como único idioma.
15. Paleta heredada del producto: verde `#006d35` como color principal (tomado de `web/public/icon.svg`).
16. Metadatos Open Graph y Twitter Card para que el link se vea bien al compartirse por WhatsApp — este es el canal real de distribución.
17. `robots.txt`, `sitemap.xml` y una sola etiqueta `<h1>` por página.
18. Deploy en Vercel como proyecto separado.

---

## Out of Scope

- Sección de precios con planes y tabla comparativa (no hay precio).
- Testimonios, logos de clientes, contadores de "X academias confían en nosotros" (no hay clientes; inventarlos es fraude y se nota).
- Formulario de contacto, agenda de demo, chat en vivo o captura de email — el único camino es `/register`.
- Blog, centro de ayuda o documentación pública.
- Multi-idioma.
- Analítica de terceros en la primera versión (decidir herramienta después; sin ella no se miden los Success Criteria, ver Dependencias).
- Cualquier cambio dentro de `web/`, `backend/` o `mobile/`.
- Registro desde el propio landing: el formulario vive en el panel y ahí se queda.

---

## Acceptance Criteria

1. El sitio corre en local con un solo comando y construye sin errores de TypeScript.
2. Las diez secciones listadas existen y tienen contenido real — ningún *lorem ipsum*, ninguna captura de ejemplo genérica.
3. Todas las capturas provienen del panel real de Futcamedic con datos de prueba, no de plantillas.
4. Cada CTA apunta a `${PUBLIC_APP_URL}/register` y abre el registro real del panel.
5. La condición de precio durante beta es visible sin hacer scroll en móvil (375 px de ancho).
6. La página se lee sin scroll horizontal entre 320 px y 1920 px.
7. Lighthouse en móvil: Performance ≥ 95, Accessibility ≥ 95, SEO ≥ 95.
8. Compartir la URL en WhatsApp muestra título, descripción e imagen correctos.
9. Ninguna afirmación del sitio carece de respaldo: cada capacidad mencionada corresponde a una fila "Verificado" de `docs/product/DEFINICION-PRODUCTO.md` o a una pantalla existente en `web/src/pages/`.
10. La sección de límites honestos está presente y no escondida detrás de un acordeón cerrado.

---

## Dependencies

| Dependencia | Estado | Bloquea |
|-------------|--------|---------|
| Decisión de precio-beta ("gratis durante la beta") | **Pendiente de confirmación** | Hero, CTA, FAQ |
| URL de producción del panel web | Desconocida (deploy en Vercel existe, falta el dominio) | Todos los CTA |
| Capturas del panel con datos de prueba | **Hecho**: 8 PNG en `landing/public/capturas/`, generados con `npm run capturas` | — |
| Video del recorrido | **Hecho**: `landing/public/demo/recorrido.mp4` (20 s, 0.2 MB), grabado con `npm run demo`. Los HTML de `docs/videos/` quedaron sin usar | — |
| Que `/register` esté abierto al público sin invitación | **Verificado**: ruta pública en `web/src/App.tsx:45`, formulario abierto que hace `POST /auth/register` con nombre de escuela, sin invitación previa | — |
| Dominio propio | No definido | Deploy final |
| Imagen para compartir (Open Graph) | **Hecho**: `landing/public/og.png`, 1200×630 | — |
| Herramienta de analítica | No elegida | Medición de los Success Criteria |
| Aviso de privacidad | No existe | Footer, cumplimiento |

---

## Estado de implementación (21 de octubre de 2026)

El sitio está construido en `landing/` (Astro 7, estático, sin JavaScript de
cliente). Las diez secciones existen con contenido real y todas las capturas
salen del panel de verdad.

**Cómo se generan las capturas sin backend.** `landing/capturas/` levanta
`web/` en modo dev con Supabase y la API apuntando a hosts stub, y lo recorre
con el arnés de mocks de `web/e2e/helpers.ts`. No se tocó ningún archivo de
`web/`: el generador vive en `landing/` e importa ese helper en modo lectura.
Esto mantiene en pie el "Out of Scope" de no modificar el panel.

**Medición real (Lighthouse 12, build de producción servido en local):**

| Perfil | Performance | Accesibilidad | Best practices | SEO |
|--------|-------------|---------------|----------------|-----|
| Móvil | 100 | 100 | 100 | 100 |
| Escritorio | 100 | 100 | 100 | 100 |

LCP móvil 1.4 s, CLS 0, TBT 0 ms. Medido contra `localhost`: sobre un dominio
real con latencia de red el LCP subirá, así que el criterio de ≤ 2.0 s en 4G
sigue sin verificarse hasta el primer deploy.

**Hallazgos del producto detectados al capturar** (no son del landing, pero
afectan lo que se muestra):

1. El nombre está escrito de dos formas en el repositorio: "Futcamedic" en
   `docs/product/`, `CLAUDE.md` y `web/package.json`; "Futcademic" en el
   directorio del repositorio y en los comentarios de `web/e2e/`. El sitio usa
   **Futcamedic**. Hay que unificar antes de registrar dominio.
2. El selector de mes de Finanzas muestra "October" en una interfaz en español,
   y la lista de pendientes dice "ADEUDA MES 10". Aparece en una captura
   publicada.
3. Un profesor recién invitado cae en `/onboarding` hasta que tiene
   `onboarded_at`. Es correcto, pero conviene saberlo: el landing promete que
   "entra y ve sus categorías", y antes hay un paso más.

**Lo que no está hecho:** publicar (falta dominio y `PUBLIC_APP_URL` real),
aviso de privacidad y herramienta de analítica.

---

## Open Questions

- ¿Confirmamos "gratis durante la beta" como mensaje de precio? Sin esto el hero no se puede escribir.
- ¿Cuál es el dominio y la URL de producción del panel?
- ¿Hay nombre comercial y logotipo definitivos, o se usa el ícono verde actual?
- ¿Quién firma el aviso de privacidad? Hay datos de menores de edad en el sistema; esto no es trámite menor.
- ¿Se pueden conseguir 1-2 academias piloto antes de publicar? Una sola cita real de un dueño vale más que todo el copy de este sitio junto.
