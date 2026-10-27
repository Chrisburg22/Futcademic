---
title: "Futcademic — Expediente de Inscripción"
subtitle: "PRD del alta presencial y la invitación remota de alumnos"
date: "26 de octubre de 2026"
author:
  - name: "Equipo de Producto"
---

# PRD: Expediente de Inscripción

## 1. Definición del producto

### 1.1 En una frase

El **Expediente de Inscripción** es la carpeta digital verificable de cada alumno: prueba quién autorizó su inscripción, con qué identificación, y reúne los documentos necesarios para inscribirlo en ligas y copas.

### 1.2 Tipo de producto

**Herramienta (software).** El admin de la academia opera el expediente; el tutor lo completa desde su celular mediante una invitación. No es una plataforma de firma electrónica certificada ni un portal de ligas.

### 1.3 El comprador

- **Quién:** dueño o director de una academia con 50–500 alumnos, 4–12 categorías y 1–5 sedes.
- **Antes:** consentimientos en papel, INEs en WhatsApp, carpetas físicas, documentos que se vuelven a pedir cada temporada y expedientes armados a última hora.
- **Después (día 30):** genera un link, el tutor llena todo desde su celular, el admin valida y descarga el paquete de liga en minutos. Sabe qué alumnos tienen expediente incompleto y qué documentos caducan.

### 1.4 Experiencia del día 1

**Camino remoto (el de mayor valor):**

1. El admin entra a Alumnos → “Invitar alumno”, elige la categoría y genera un link de un solo uso.
2. Comparte el link por WhatsApp o correo.
3. El tutor lo abre en su celular sin crear cuenta, llena los datos del alumno y del tutor, acepta los consentimientos, sube su identificación oficial y los documentos del alumno.
4. Envía la solicitud. El admin recibe una notificación y la revisa.
5. El admin valida la identificación, corrige la categoría si hace falta y aprueba.
6. Se crea el alumno con su expediente. Si faltan documentos del alumno, queda `incompleto`; si están todos, `completo`.
7. El admin descarga el paquete de liga cuando lo necesita.

**Camino presencial (respaldo):**

1. El admin abre “Nuevo alumno” y captura al alumno y al tutor.
2. Si el tutor está presente, captura el consentimiento en el mismo dispositivo y sube su identificación.
3. Si no está, guarda el alumno con expediente `sin_tutor` o `incompleto`; el consentimiento se puede capturar después en la ficha, o generar el link de invitación antes de crear al alumno.
4. Los documentos del alumno se suben en el wizard o después en la pestaña Expediente.

### 1.5 Qué recibe el comprador

- Una bandeja de **solicitudes de inscripción** separada de la lista de alumnos.
- Un **expediente por alumno** con consentimiento, identificación del tutor, documentos del alumno, estados y caducidades.
- Un **PDF de consentimiento** con texto versionado, fecha, evidencia y nombre del tutor.
- Un **paquete de liga** descargable con los documentos validados.
- Un **reporte de expedientes incompletos** y documentos por vencer.

### 1.6 Qué ya no tiene que hacer

- Perseguir fotos de INE por WhatsApp.
- Volver a capturar los datos que el tutor puede escribir.
- Recolectar los mismos documentos en cada torneo.
- Adivinar qué documento falta.
- Guardar carpetas físicas o fotos en el celular de un empleado.
- Confiar en la memoria de quién firmó.

### 1.7 Qué sigue teniendo que hacer

- Validar que la identificación corresponde al tutor (juicio humano).
- Conseguir los documentos que la familia no tenga a mano.
- Actualizar el texto legal y re-consentir cuando cambie.
- Entregar originales o documentos físicos si la liga los exige.
- Resolver excepciones: tutores sin correo, custodia compartida, alumnos mayores de edad.

### 1.8 Límites explícitos

- No es firma electrónica certificada ni verificación biométrica de identidad.
- No se integra con el portal de la liga.
- No hace OCR ni validación automática de la INE.
- No sustituye el expediente médico ni los originales.
- No modela ligas o copas con requisitos propios en la v1.
- No procesa pagos.

### 1.9 Decisiones cerradas

| Decisión | Valor | Consecuencia |
|---|---|---|
| Uso del link | Un solo uso por alumno, expira a los 7 días, revocable | Un link por hijo; para hermanos se generan links separados |
| Resultado del envío | Solicitud pendiente de aprobación | El alumno no existe hasta que el admin aprueba |
| Contacto del tutor | Correo y celular obligatorios | Se puede crear/invitar la cuenta del tutor al aprobar |
| Canal de consentimiento | Presencial en el wizard y remoto por link | El remoto es el camino principal para invitar; el presencial es respaldo |
| Evidencia del consentimiento | Check + nombre escrito + fecha/IP/dispositivo + PDF | Registro auditable, no firma electrónica certificada |
| Conocimiento del link | La categoría es el único dato de negocio; academia y vigencia son contexto del token | No muestra alumnos, cuotas, otras categorías ni datos del tutor |
| Documentos | Checklist estándar + “otro” | Acta, CURP, identificación del tutor, comprobante, certificado médico y foto |
| Expediente incompleto | Solo bloquea el paquete de liga | El alumno entrena, se cobra y se gestiona normal |

## 2. Problema

Hoy el alta termina en “Registrar alumno”: el backend crea la identidad, el perfil y el registro en `students` con `status: 'activo'` en la misma operación. No existe consentimiento, tabla de documentos, bucket privado ni estado de expediente. El wizard permite “Sin padre/tutor” y el tutor invitado no tiene ninguna tarea pendiente si no activa su cuenta.

Además, la carga real de Serratos (corte del 22/10/2026) tiene 265 alumnos sin tutor. Cualquier regla que bloquee por falta de tutor deja fuera al alumnado existente.

El resultado es papeleo disperso: el consentimiento vive en papel o en un chat, la INE en la galería de alguien, los documentos en una carpeta física y la información del alumno repetida en tres lugares. Cuando llega la liga, el admin arma el expediente a última hora y no sabe con certeza qué le falta a cada alumno.

## 3. Objetivos y métricas

| Objetivo | Métrica | Meta v1 |
|---|---|---|
| El tutor completa la inscripción sin ir a la academia | Tasa de links enviados que terminan en solicitud enviada | ≥ 70% en 72 h |
| El formulario no se abandona | Tiempo medio de llenado y porcentaje de borradores retomados | < 10 min; ≥ 30% de borradores retomados |
| El admin revisa rápido | Tiempo medio de revisión por solicitud | < 3 min |
| El expediente está listo antes de la liga | Alumnos con expediente completo antes del deadline | 100% de los inscritos a liga |
| La liga no rechaza por papeles | Paquetes rechazados por documento faltante | 0 |
| Los documentos están protegidos | Archivos en buckets públicos / accesos sin autorización | 0 |
| El alumno no se usa como palanca | Alumnos bloqueados de entrenar por expediente incompleto | 0 |

Instrumentación: eventos de link creado, link abierto, borrador guardado, solicitud enviada, aprobada y rechazada. Sin PII en analítica.

## 4. Historias de usuario

- Como **admin**, necesito generar un link de inscripción para una categoría y compartirlo por WhatsApp, para que el tutor llene todo sin venir a la academia.
- Como **tutor**, necesito abrir el link en mi celular sin crear cuenta, para inscribir a mi hijo en menos de 10 minutos.
- Como **tutor**, necesito guardar el avance y continuar después, porque no siempre tengo los documentos a mano.
- Como **tutor**, necesito tomarle foto a mi INE y a los documentos con la cámara, sin escanear ni imprimir.
- Como **tutor**, necesito leer el consentimiento completo y aceptar cada autorización por separado, para saber qué estoy firmando.
- Como **admin**, necesito ver las solicitudes que llegan y validar la identificación del tutor, para que el expediente sea confiable.
- Como **admin**, necesito rechazar una solicitud con motivo y reabrir el link, para que el tutor corrija sin generar otro link.
- Como **admin**, necesito capturar el consentimiento en el dispositivo cuando el tutor está presente, para cerrar el expediente en el momento.
- Como **admin**, necesito subir documentos después del alta desde la pestaña Expediente, porque el tutor no siempre los trae.
- Como **admin**, necesito ver qué falta y qué caduca, para no llegar a la liga con el expediente incompleto.
- Como **admin**, necesito descargar el paquete de liga de un alumno, para enviarlo al organizador sin buscar archivos uno por uno.
- Como **admin**, necesito regularizar a los 265 alumnos existentes sin tutor, sin bloquearlos ni migrarlos a mano.
- Como **profesor**, necesito ver si el expediente está completo, para saber quién puede ser inscrito, sin ver los documentos.

## 5. Alcance funcional

### 5.1 Dos puertas, un solo expediente

El producto tiene dos entradas que escriben el mismo expediente:

1. **Presencial:** el admin usa el wizard de “Nuevo alumno”.
2. **Remoto:** el admin genera un link y el tutor llena la solicitud.

Ambas comparten el mismo modelo de consentimiento, documentos, estados y validación. Lo que se capture en el wizard se puede completar después en la pestaña Expediente; lo que llegue por el link se revisa en la bandeja de Solicitudes.

### 5.2 Wizard presencial

El wizard pasa de 3 a 5 pasos:

1. **Alumno:** nombre completo, fecha de nacimiento, CURP opcional, categoría, teléfono y dirección.
2. **Tutor:** elegir existente, registrar nuevo (nombre, parentesco, correo y celular obligatorios) o marcar “tutor pendiente”.
3. **Consentimiento:** si el tutor está presente, mostrar el texto completo, las autorizaciones y el nombre escrito. Si no está, ofrecer “Enviar link al tutor” (cierra el wizard sin crear al alumno) y “Guardar pendiente” (crea al alumno con expediente incompleto).
4. **Documentos:** identificación del tutor (frente y reverso) y checklist del alumno. Todos son opcionales aquí; el wizard muestra qué falta y permite completarlo después.
5. **Resumen:** alumno, tutor, estado del consentimiento, documentos faltantes y advertencia de expediente incompleto. “Registrar alumno” siempre está disponible si los campos obligatorios del alumno están completos.

Reglas:

- El wizard nunca obliga a tener consentimiento o documentos para crear al alumno. El expediente nace `incompleto` y se completa después.
- Si el admin elige “Sin tutor”, el expediente queda `sin_tutor` y el alumno se crea igual. La UI debe explicar que sin tutor no se puede firmar consentimiento ni generar paquete de liga.
- “Enviar link al tutor” crea una invitación con la categoría seleccionada y cierra el wizard sin crear al alumno. Evita capturar dos veces los mismos datos.
- El paso de documentos reutiliza los mismos componentes de la pestaña Expediente.

### 5.3 Invitación remota

**Generación del link**

- Desde Alumnos → “Invitar alumno”, desde la ficha de una categoría o desde el wizard.
- El admin elige categoría, vigencia (7 días por defecto) y una nota interna opcional.
- El sistema crea un token aleatorio de 256 bits, guarda solo su hash y devuelve la URL una sola vez.
- El admin puede copiar el link, compartirlo por `wa.me` o descargar un QR.
- La invitación se puede revocar antes de usarse.

**Qué sabe y qué no sabe el link**

| El link sí sabe | El link no sabe |
|---|---|
| Academia (nombre y logo) | Nombre del alumno |
| Categoría (nombre y años de nacimiento) | Nombre del tutor |
| Vigencia y estado | Correo o celular del tutor |
| | Cuotas, alumnos, otras categorías, plantilla |

El token es opaco. El servidor lo resuelve a `school_id`, `category_id` e `invitation_id`; el cliente nunca recibe esos identificadores. El backend ignora cualquier `category_id` o `school_id` que mande el formulario y usa siempre los del token.

El nombre y logo de la academia se muestran solo para que el tutor sepa quién lo invita; no son datos del alumno. La invitación no revela nada más del contexto de la academia.

**Formulario del tutor**

1. **Alumno:** nombre, fecha de nacimiento, CURP (opcional), teléfono, dirección, contacto de emergencia y notas médicas.
2. **Tutor:** nombre, parentesco, correo, celular y dirección si es distinta.
3. **Consentimiento:** texto completo, cuatro autorizaciones separadas (datos, participación, atención médica de urgencia, uso de imagen opcional) y nombre completo escrito.
4. **Documentos:** identificación oficial del tutor (frente y reverso) y checklist del alumno.
5. **Revisión y envío:** resumen de todo, confirmación de que la información es correcta y botón “Enviar solicitud”.

Reglas:

- El formulario es mobile-first, con cámara y galería, y muestra el progreso.
- Se guarda un borrador en el servidor: el tutor puede cerrar el navegador y volver con el mismo link.
- Se exige el bloque legal para enviar: datos del alumno, datos del tutor, consentimiento e identificación del tutor. Los documentos del alumno pueden quedar pendientes y el expediente se marca `incompleto`.
- El formulario advierte si la fecha de nacimiento no corresponde a los años de la categoría y pide confirmar que los datos son correctos antes de enviar. El admin corrige la categoría en la revisión o rechaza la solicitud. No se bloquea al tutor por un error de categoría del admin.
- Al enviar, el link queda `usado`. La solicitud pasa a `enviada` y el admin recibe una notificación.
- Si el admin rechaza, puede reabrir el link para que el tutor corrija y reenvíe. El link no se reutiliza para otro alumno.

### 5.4 Bandeja de solicitudes y aprobación

- Nueva sección **Solicitudes** dentro de Alumnos, con contador de pendientes.
- Filtros por categoría, estado y fecha.
- Detalle de la solicitud: datos del alumno, tutor, consentimiento, documentos y evidencia (fecha, IP, dispositivo).
- Acciones:
  - **Aprobar:** valida identificación y consentimiento, crea o reutiliza al tutor, crea al alumno y adjunta el expediente.
  - **Rechazar:** exige motivo; el tutor lo ve al reabrir el link.
  - **Reabrir:** vuelve a activar el link para corrección.
  - **Cambiar categoría:** permitido en la revisión, con registro de quién lo hizo.
- La aprobación exige consentimiento e identificación del tutor validados. Los documentos del alumno pueden quedar pendientes.
- Si el correo del tutor ya existe en la escuela, se reutiliza su cuenta y, si tiene una identificación ya validada, se reutiliza para los hermanos.
- Si el tutor es nuevo, se crea/invita al aprobar. Si el correo falla, el expediente queda aprobado igual y el admin puede reenviar la invitación.
- Al aprobar se crea el alumno con la misma lógica actual (identidad, `users`, `profile_information`, `students`) extraída a un servicio reutilizable.
- Al aprobar, el consentimiento y los documentos se mueven de la solicitud al alumno actualizando su vínculo; no se duplican archivos.

### 5.5 Expediente del alumno

Nueva pestaña **Expediente** en la ficha del alumno:

- **Consentimiento:** estado, versión del texto, fecha, quién lo capturó, nombre del tutor y PDF descargable.
- **Identificación del tutor:** frente y reverso, estado (`pendiente`, `validada`, `rechazada`), motivo de rechazo y vigencia opcional.
- **Documentos del alumno:** checklist con estado, fecha de carga, caducidad, validador y motivo de rechazo.
- **Estado del expediente:** `sin_tutor`, `incompleto`, `en_revision` o `completo`.
- **Paquete de liga:** botón habilitado solo si el expediente está completo.
- **Acciones:** subir, reemplazar, validar, rechazar y descargar.

El admin puede subir documentos en cualquier momento. El profesor solo ve el badge de estado; no ve archivos ni datos sensibles.

### 5.6 Paquete de liga

- Descarga en ZIP con:
  - Carátula PDF con datos del alumno, categoría, tutor y fecha.
  - Consentimiento en PDF.
  - Identificación del tutor.
  - Documentos del alumno validados.
- Nombres de archivo legibles: `acta-nombre-alumno.pdf`, `ine-tutor-frente.pdf`, etc.
- Solo incluye documentos validados. Si falta uno obligatorio, el botón está deshabilitado y muestra qué falta.
- Cada descarga queda registrada (quién y cuándo).
- No se comparte mediante link público en la v1; el admin descarga y envía por su canal.

### 5.7 Alumnos existentes

- Los alumnos actuales se marcan como `sin_tutor` o `incompleto`; no se bloquea nada.
- El admin puede iniciar el expediente desde la ficha o generar un link de regularización por alumno (v1.1).
- La carga masiva de Serratos no se migra a mano: se muestra el estado y se prioriza a los alumnos que van a liga.

## 6. Reglas del link

1. **Un solo uso.** Se consume al enviar la solicitud, no al abrir ni al guardar borrador.
2. **Expira a los 7 días** por defecto; el admin puede revocarlo antes.
3. **Token opaco de 256 bits.** Se guarda solo el hash; nunca el token en claro.
4. **Sin datos en la URL.** No se pone nombre, correo, alumno ni identificadores de base de datos.
5. **Sin indexación.** `noindex`, `Referrer-Policy: no-referrer`, sin terceros en la página.
6. **Rate limit** por token e IP en apertura, guardado y envío.
7. **El servidor manda.** `school_id` y `category_id` salen del token, no del formulario.
8. **Mensaje claro si expira, se usa o se revoca:** “Este link ya no está disponible. Contacta a la academia.”
9. **El link no revela si un correo ya existe.** No hay enumeración de tutores.
10. **El link de un alumno no sirve para otro.** Para hermanos se genera uno nuevo, aunque la identificación del tutor se reutilice al aprobar.

## 7. Modelo de datos

### 7.1 Tablas nuevas

**`enrollment_invitations`**

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `school_id` | uuid | FK schools |
| `category_id` | uuid | FK categories |
| `token_hash` | text | unique, SHA-256 del token |
| `created_by` | uuid | FK users |
| `expires_at` | timestamptz | |
| `used_at` | timestamptz | null hasta enviar |
| `revoked_at` | timestamptz | null |
| `application_id` | uuid | null hasta enviar |
| `note` | text | nota interna opcional |
| `created_at` | timestamptz | |

**`enrollment_applications`**

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `school_id` | uuid | FK schools |
| `invitation_id` | uuid | FK enrollment_invitations |
| `category_id` | uuid | FK categories |
| `status` | text | `borrador`, `enviada`, `en_revision`, `aprobada`, `rechazada` |
| `student_full_name` | text | |
| `student_birth_date` | date | |
| `student_curp` | text | opcional, para duplicados y liga |
| `student_phone` | text | |
| `student_address` | text | |
| `emergency_contact_name` | text | |
| `emergency_contact_phone` | text | |
| `medical_notes` | text | |
| `guardian_full_name` | text | |
| `guardian_relationship` | text | padre, madre, tutor, abuelo, otro |
| `guardian_email` | text | obligatorio |
| `guardian_phone` | text | obligatorio |
| `guardian_address` | text | opcional, si es distinta a la del alumno |
| `submitted_at` | timestamptz | |
| `reviewed_by` | uuid | FK users |
| `reviewed_at` | timestamptz | |
| `rejection_reason` | text | |
| `student_id` | uuid | null hasta aprobar |
| `created_at` / `updated_at` | timestamptz | |

**`enrollment_consents`**

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `school_id` | uuid | FK schools |
| `application_id` | uuid | null si es presencial |
| `student_id` | uuid | null si es solicitud |
| `guardian_name` | text | nombre escrito |
| `guardian_relationship` | text | |
| `consent_version` | text | versión del texto |
| `text_hash` | text | hash del texto mostrado |
| `accepted_data` | boolean | obligatorio |
| `accepted_participation` | boolean | obligatorio |
| `accepted_medical` | boolean | obligatorio |
| `accepted_image` | boolean | opcional |
| `accepted_at` | timestamptz | |
| `ip` | inet | |
| `user_agent` | text | |
| `pdf_path` | text | PDF generado |
| `revoked_at` | timestamptz | null |

Regla: exactamente uno de `application_id` o `student_id` debe estar presente.

**`enrollment_documents`**

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `school_id` | uuid | FK schools |
| `application_id` | uuid | null si ya es alumno |
| `student_id` | uuid | null si es solicitud |
| `owner_type` | text | `alumno` o `tutor` |
| `doc_type` | text | `acta_nacimiento`, `curp`, `identificacion_tutor_frente`, `identificacion_tutor_reverso`, `comprobante_domicilio`, `certificado_medico`, `foto_alumno`, `otro` |
| `file_path` | text | bucket privado |
| `mime_type` | text | |
| `size_bytes` | bigint | |
| `status` | text | `pendiente`, `validado`, `rechazado`, `vencido` |
| `expires_at` | date | null si no caduca |
| `uploaded_by` | uuid | usuario o null si fue el tutor |
| `uploaded_at` | timestamptz | |
| `verified_by` | uuid | FK users |
| `verified_at` | timestamptz | |
| `rejection_reason` | text | |

Regla: exactamente uno de `application_id` o `student_id` debe estar presente.

**`consent_templates`**

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `school_id` | uuid | null si es plantilla global |
| `version` | text | ej. `2026-11-v1` |
| `body_md` | text | texto completo que se muestra |
| `body_hash` | text | SHA-256 del texto |
| `active` | boolean | solo una activa por escuela/global |
| `created_by` | uuid | FK users |
| `created_at` | timestamptz | |

El consentimiento guarda `consent_version` y `text_hash`; la plantilla permite reconstruir exactamente lo que se mostró. Cambiar el texto crea una versión nueva; no se edita la anterior.

**`enrollment_access_log`**

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `school_id` | uuid | FK schools |
| `invitation_id` | uuid | null si es acceso autenticado |
| `user_id` | uuid | null si es acceso público |
| `action` | text | `view`, `download`, `upload`, `approve`, `reject`, `reopen` |
| `entity_type` | text | `application`, `student`, `document`, `package` |
| `entity_id` | uuid | |
| `ip` | inet | |
| `user_agent` | text | |
| `created_at` | timestamptz | |

Registra descargas de documentos y paquetes, aprobaciones, rechazos y reaperturas. No guarda el token completo.

### 7.2 Cambios a tablas existentes

- `students.curp` text null, indexado por `school_id`.
- `students.guardian_relationship` text null, para mostrar el parentesco sin depender de `users`.
- Vista `student_expediente_status` que calcula el estado a partir de consentimiento y documentos obligatorios. No se guarda un estado redundante en `students`.

### 7.3 Almacenamiento

- Bucket privado `enrollment-documents`.
- Ruta opaca: `{school_id}/{application_id|student_id}/{uuid}.{ext}`.
- URL firmada de 5 minutos para ver o descargar.
- Límite de 10 MB por archivo; fotos comprimidas en el cliente a menos de 2 MB.
- Formatos: PDF, JPG, PNG, WEBP. HEIC se convierte a JPEG en el cliente o en el servidor.
- Validación de tipo real (magic bytes), no solo extensión.

## 8. API

### 8.1 Públicas (sin auth, token en la URL)

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/enrollment/:token` | Datos mínimos: academia, categoría, años, vigencia, estado |
| PUT | `/api/enrollment/:token/draft` | Guardar borrador |
| POST | `/api/enrollment/:token/documents` | Subir documento del formulario |
| POST | `/api/enrollment/:token/submit` | Enviar solicitud |
| GET | `/api/enrollment/:token/consent.pdf` | Descargar consentimiento después de enviar |

### 8.2 Administrativas (auth + tenant)

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/enrollment/invitations` | admin, profesor con `can_manage_students` |
| GET | `/api/enrollment/invitations` | admin, profesor |
| DELETE | `/api/enrollment/invitations/:id` | admin |
| GET | `/api/enrollment/applications` | admin, profesor |
| GET | `/api/enrollment/applications/:id` | admin, profesor |
| POST | `/api/enrollment/applications/:id/approve` | admin |
| POST | `/api/enrollment/applications/:id/reject` | admin |
| POST | `/api/enrollment/applications/:id/reopen` | admin |
| GET | `/api/students/:id/expediente` | admin; profesor solo estado; padre propio |
| POST | `/api/students/:id/consent` | admin |
| GET | `/api/students/:id/consent.pdf` | admin, padre propio |
| POST | `/api/students/:id/documents` | admin |
| PATCH | `/api/students/:id/documents/:docId` | admin |
| GET | `/api/students/:id/expediente/package` | admin |

Las rutas públicas se montan antes de `requireAuth`. Cualquier alta o cambio de ruta exige `npm run routes:dump` y actualizar `api-contract.json`.

## 9. Seguridad, privacidad y retención

- Documentos de menores e identificaciones son datos sensibles: bucket privado, sin URLs públicas, acceso por rol y tenant.
- El padre solo ve a sus hijos; el profesor solo ve el badge de expediente, no archivos; el admin ve su escuela.
- Cada descarga de documento o paquete queda registrada (usuario, fecha, documento).
- El consentimiento guarda versión del texto, hash, fecha, IP y dispositivo. Si el texto cambia, se re-consiente.
- Las solicitudes rechazadas se conservan 30 días y luego se eliminan sus archivos; el registro mínimo de auditoría se conserva sin documentos.
- Los borradores no enviados se eliminan 30 días después de que expira su link.
- Los documentos de alumnos inactivos se conservan mientras dure la relación y el plazo legal que defina el abogado.
- El link no se registra en logs con el token completo; se registra el `invitation_id`.
- La página pública no carga analítica de terceros ni fuentes externas que reciban el referrer.

## 10. Criterios de aceptación

- [ ] Al crear un alumno desde el wizard se crea un expediente `incompleto` o `sin_tutor`; nunca se impide el alta por falta de consentimiento o documentos.
- [ ] El wizard tiene los pasos Alumno, Tutor, Consentimiento, Documentos y Resumen, y permite guardar y completar después.
- [ ] El consentimiento no se guarda sin las tres autorizaciones obligatorias y el nombre escrito del tutor.
- [ ] El PDF de consentimiento incluye texto, versión, fecha, alumno, tutor, categoría y evidencia.
- [ ] El admin puede subir, reemplazar, validar y rechazar documentos desde la pestaña Expediente.
- [ ] El link se genera solo para una categoría y no crea al alumno hasta la aprobación.
- [ ] El link es de un solo uso, expira a los 7 días, se puede revocar y no se consume al guardar borrador.
- [ ] La página pública solo devuelve academia, categoría, años, vigencia y estado; no devuelve alumnos, cuotas ni datos del tutor.
- [ ] El backend ignora `school_id` y `category_id` enviados por el cliente y usa los del token.
- [ ] Un link usado, expirado o revocado muestra un mensaje claro y no permite enviar.
- [ ] El tutor puede guardar un borrador y retomarlo desde el mismo link.
- [ ] El formulario advierte si la fecha de nacimiento no corresponde a la categoría y permite enviar con confirmación; el admin puede corregirla al revisar.
- [ ] Al aprobar se crea el alumno, se adjunta el consentimiento, se adjuntan los documentos y se reutiliza al tutor si ya existe.
- [ ] Al rechazar se exige motivo y se puede reabrir el link para corregir.
- [ ] El expediente solo pasa a `completo` cuando el consentimiento está firmado, la identificación del tutor está validada y todos los documentos obligatorios están validados.
- [ ] Un expediente incompleto no bloquea asistencia, pagos ni estado del alumno; solo bloquea el paquete de liga.
- [ ] El paquete de liga solo incluye documentos validados y registra la descarga.
- [ ] El padre solo ve los documentos de sus hijos; el profesor no ve archivos.
- [ ] Los alumnos existentes sin tutor aparecen como `sin_tutor` y no se bloquean.
- [ ] No hay archivos en buckets públicos ni URLs permanentes.
- [ ] Los tests cubren token expirado, token usado, token revocado, acceso cruzado entre escuelas, aprobación, rechazo y duplicados.

## 11. Fuera de alcance

- Link reusable por categoría para campañas masivas.
- Firma electrónica certificada o biometría.
- Selfie del tutor con la INE.
- OCR o validación automática de documentos.
- Plantillas de requisitos por liga o copa.
- Integración con portales de ligas.
- Link público para compartir documentos con el organizador.
- App móvil nativa para padres.
- Portal del padre con expediente completo (v1.1).
- Link de regularización para alumnos existentes (v1.1).
- Gestión de pagos o cobros dentro del expediente.
- Múltiples tutores con custodia compartida.

## 12. Dependencias y riesgos

| Dependencia / riesgo | Impacto | Mitigación |
|---|---|---|
| Texto legal sin revisar | Consentimiento débil o inválido | Revisión de abogado antes de producción; texto versionado |
| Checklist de liga supuesto | Documentos faltantes o sobrantes | Validar con la academia y una liga real antes de cerrar v1 |
| Formulario largo en móvil | Abandono alto | Pasos cortos, borrador, cámara, campos opcionales, WhatsApp |
| HEIC de iPhone | Archivos que no se previsualizan | Convertir a JPEG en cliente o servidor; probar en iOS |
| Link filtrado | Solicitudes no deseadas | Un solo uso, expiración, rate limit, aprobación, revocación |
| Duplicados | Dos expedientes para el mismo niño | Detección por CURP o nombre + fecha + teléfono; revisión |
| Identidad remota | La INE no prueba quién firmó | Validación humana; opción presencial; no prometer verificación certificada |
| Tutor con correo existente | Invitación falla o duplica | Servicio `ensureGuardian` probado con hermanos y escuelas distintas |
| Alumno mayor de edad | Firma del tutor no aplica | Definir flujo de auto-consentimiento en v1.1 |
| Retención de datos | Riesgo legal y de almacenamiento | Política definida con abogado; borrado de rechazadas |
| PDF y ZIP | Dependencias nuevas | Librería PDF en backend y generación de ZIP con streams |
| Contrato de rutas | `contract.test.ts` falla | `npm run routes:dump` en el mismo cambio |
| `dist/` comprometido | Deploy desactualizado | `npm run build` y commit de `dist/` |

## 13. Preguntas abiertas

1. ¿La liga pide los documentos en PDF, en físico o en su propio portal? Define si el paquete es ZIP, PDF único o descarga individual.
2. ¿Cuál es el checklist exacto de la liga y cuáles documentos caducan?
3. ¿Cuánto tiempo se conservan los documentos de alumnos inactivos y de solicitudes rechazadas?
4. ¿La imagen del alumno es obligatoria para la liga o solo para el perfil?
5. ¿Qué pasa con alumnos de 18 años o más? ¿Firman ellos o sigue firmando el tutor?
6. ¿Se necesita selfie del tutor con la INE para ligas de mayor riesgo?
7. ¿El padre debe ver el expediente y los documentos desde su portal en v1 o v1.1?
8. ¿Se permite un tutor sin cuenta (solo teléfono) en el futuro, o el correo siempre será obligatorio?
9. ¿La academia quiere un link de regularización para los 265 alumnos existentes sin tutor?

## 14. Fases de implementación

| Fase | Entregable | Verificación |
|---|---|---|
| 0. Legal y requisitos | Texto de consentimiento, checklist de liga, retención | Revisión de abogado y academia |
| 1. Base de datos y storage | Tablas, bucket privado, vista de estado, auditoría | Migraciones aplicadas; tests de acceso |
| 2. Token e invitaciones | Crear, listar, revocar, resolver token, expiración, single-use | Tests de token y rate limit |
| 3. Formulario público | `/inscripcion/[token]`, borrador, cámara, documentos, envío | E2E móvil con backend mockeado |
| 4. Bandeja y aprobación | Solicitudes, detalle, validar, aprobar, rechazar, reabrir | Tests de aprobación y duplicados |
| 5. Wizard y expediente | 5 pasos, pestaña Expediente, estados y filtros | Tests de alta y carga posterior |
| 6. PDF y paquete | Consentimiento PDF, ZIP de liga, registro de descargas | Tests de contenido y permisos |
| 7. Cierre | Reportes, caducidades, alumnos existentes, documentación | `npm test`, `npm run build`, `routes:dump`, e2e |

## 15. Verificación del cambio

- Backend: `npm test`, `npm run routes:dump`, `npm run build`; commit de `dist/` y `api-contract.json`.
- Web: `npm run build`; `npm run test:e2e` para el flujo de invitación, aprobación y expediente.
- Pruebas nuevas mínimas:
  - Token válido, expirado, usado y revocado.
  - El endpoint público no devuelve datos de otros alumnos ni categorías.
  - `school_id`/`category_id` del body se ignoran.
  - Un padre no puede leer documentos de otro alumno.
  - Aprobar crea alumno, perfil y expediente; rechazar no crea alumno.
  - Hermano reutiliza tutor e identificación validada.
  - El paquete de liga se bloquea con expediente incompleto.
  - HEIC/JPEG/PDF se aceptan o convierten correctamente.

## Anexo A — Autorizaciones del consentimiento

1. **Tratamiento de datos personales del menor** (obligatoria).
2. **Participación en entrenamientos, partidos y traslados organizados por la academia** (obligatoria).
3. **Atención médica de urgencia** (obligatoria).
4. **Uso de imagen del menor** (opcional; se puede revocar sin afectar la inscripción).

El texto completo debe estar visible antes de aceptar. No se permite aceptar con un solo check que englobe las cuatro; cada una se registra por separado.

## Anexo B — Checklist estándar de documentos

| Documento | Obligatorio | Caduca | Origen |
|---|---|---|---|
| Acta de nacimiento | Sí | No | Tutor |
| CURP | Sí | No | Tutor |
| Identificación oficial del tutor (frente) | Sí | Opcional | Tutor |
| Identificación oficial del tutor (reverso) | Sí | Opcional | Tutor |
| Comprobante de domicilio | Sí | Sí (3 meses) | Tutor |
| Certificado médico | Sí | Sí (temporada) | Tutor |
| Foto del alumno | Sí | No | Tutor |
| Otro | No | Según tipo | Admin |

La lista es una hipótesis hasta validarla con una liga real. Si la liga pide algo distinto, se ajusta antes de producción.
