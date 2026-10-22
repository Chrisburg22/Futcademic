/**
 * Configuración y contenido del landing.
 *
 * Todo el texto vive aquí para que se pueda corregir sin tocar markup.
 * Regla del PRD: ninguna afirmación sin respaldo en
 * `docs/product/DEFINICION-PRODUCTO.md` (filas "Verificado") o en una pantalla
 * real de `web/src/pages/`.
 */

const env = import.meta.env;

export const APP_URL: string = (env.PUBLIC_APP_URL || 'https://app.futcademic.com').replace(/\/$/, '');
export const SITE_URL: string = (env.PUBLIC_SITE_URL || 'https://futcademic.com').replace(/\/$/, '');
export const PRIVACY_URL: string = env.PUBLIC_PRIVACY_URL || '';

export const REGISTER_URL = `${APP_URL}/register`;
export const LOGIN_URL = `${APP_URL}/login`;

export const SITE = {
  name: 'Futcademic',
  title: 'Futcademic — El sistema para administrar tu academia de fútbol',
  description:
    'Alumnos, asistencias, pagos y entrenamientos de tu academia en un solo lugar. Gratis durante la beta. Crea tu academia en menos de 10 minutos.',
  locale: 'es_MX',
  email: 'hola@futcademic.com',
};

/** Precio. Decisión del Product Owner: beta gratuita declarada. */
export const PRECIO = {
  corto: 'Gratis durante la beta',
  largo: 'Gratis durante la beta. Te avisamos con 30 días de anticipación antes de cobrar.',
};

export const HERO = {
  kicker: 'Para academias de fútbol de 50 a 500 alumnos',
  titulo: 'Tu academia completa, sin cuadernos ni Excel',
  subtitulo:
    'Registra alumnos, pasa lista, cobra mensualidades y programa entrenamientos desde el teléfono. Todo tu equipo —profesores, padres y alumnos— en el mismo sistema.',
  cta: 'Crear mi academia gratis',
  ctaNota: 'Sin tarjeta. Sin llamada de ventas. Tú creas la cuenta.',
};

export const ANTES = {
  titulo: 'Hoy tu academia corre en cuatro lugares distintos',
  entrada:
    'Y ninguno habla con el otro. Si alguno de estos cuatro es tu realidad, este sistema fue hecho para ti.',
  dolores: [
    {
      titulo: 'El cuaderno de asistencia',
      texto:
        'Cada profesor lleva el suyo. A fin de mes nadie puede decirte qué alumno lleva tres semanas sin venir, y para cuando te enteras, ya se fue.',
    },
    {
      titulo: 'El Excel de alumnos',
      texto:
        'Vive en una laptop. Tiene la versión buena, la versión del año pasado y la que alguien editó sin avisar. El teléfono del papá de un alumno está en tres celdas distintas.',
    },
    {
      titulo: 'El efectivo sin control',
      texto:
        'Cobras en la cancha, lo anotas en el celular y lo pasas al Excel el domingo. No sabes cuánto te deben hoy, y perseguir a quien debe dos meses es una conversación incómoda que pospones.',
    },
    {
      titulo: 'El grupo de WhatsApp',
      texto:
        'Es tu sistema de avisos, tu calendario y tu atención a clientes al mismo tiempo. Un cambio de horario se pierde entre doscientos mensajes y el sábado llegan cinco alumnos de doce.',
    },
  ],
};

export const MODULOS = {
  titulo: 'Cuatro módulos, una sola base de datos',
  entrada:
    'Lo que registras en uno aparece en los otros. Un alumno dado de alta ya existe en la lista de asistencia, en el estado de cuenta y en la agenda de su categoría.',
  items: [
    {
      id: 'alumnos',
      nombre: 'Alumnos y categorías',
      texto:
        'Alta de alumnos con sus datos, su foto y el contacto de sus padres. Los organizas en categorías por rango de año de nacimiento —Sub-12, Sub-14— y asignas el profesor responsable de cada una.',
      bullets: [
        'Ficha completa por alumno, con historial',
        'Categorías con cuota mensual propia',
        'Un profesor responsable por categoría',
      ],
      captura: '/capturas/alumnos.png',
      alt: 'Pantalla de gestión de alumnos del panel de Futcademic con la lista de alumnos, su categoría y su estatus',
    },
    {
      id: 'asistencias',
      nombre: 'Asistencias',
      texto:
        'El profesor pasa lista desde su teléfono en la cancha, con la lista de su categoría ya cargada. El porcentaje de asistencia de cada alumno se calcula solo: tú no sumas nada.',
      bullets: [
        'Pase de lista en el celular, al momento',
        'Porcentaje por alumno calculado automáticamente',
        'Cada profesor ve solo sus categorías',
      ],
      captura: '/capturas/asistencias.png',
      alt: 'Pantalla de pase de lista del panel de Futcademic mostrando los alumnos de una categoría',
    },
    {
      id: 'pagos',
      nombre: 'Pagos',
      texto:
        'Registras el pago cuando lo recibes y el sistema avisa al padre por notificación. En cualquier momento ves quién está al corriente y quién debe, por mes y por categoría.',
      bullets: [
        'Lista de pendientes del mes, siempre actualizada',
        'Notificación automática al padre al registrar un pago',
        'Exportación a PDF y Excel',
      ],
      captura: '/capturas/finanzas.png',
      alt: 'Pantalla de finanzas del panel de Futcademic con los pagos registrados y los pendientes del mes',
    },
    {
      id: 'eventos',
      nombre: 'Eventos y entrenamientos',
      texto:
        'Programas el entrenamiento una vez —día, hora, cancha y categoría— y lo repites semanal, quincenal o mensualmente. El sistema genera todas las sesiones de la temporada.',
      bullets: [
        'Entrenamientos recurrentes generados automáticamente',
        'Partidos y eventos especiales en la misma agenda',
        'Canchas y sedes con sus datos',
      ],
      captura: '/capturas/agenda.png',
      alt: 'Agenda del panel de Futcademic con los entrenamientos y partidos programados por categoría',
    },
  ],
};

export const ROLES = {
  titulo: 'Cada quien entra y ve lo que le toca',
  entrada:
    'Esto es lo que un Excel compartido nunca va a poder hacer. Tú invitas a tu equipo por correo y el sistema se encarga de lo que cada uno puede ver y hacer.',
  items: [
    {
      rol: 'Dueño o administrador',
      texto:
        'Ve la academia completa: alumnos, dinero, asistencias, agenda y profesores. Invita al equipo y define los permisos de cada profesor.',
      captura: '/capturas/dashboard-admin.png',
      alt: 'Dashboard del administrador en Futcademic con alumnos activos, ingreso del mes, pagos pendientes y tasa de asistencia',
    },
    {
      rol: 'Profesor',
      texto:
        'Entra y ve solo sus categorías. Pasa lista y consulta a sus alumnos. No ve las finanzas de la academia salvo que tú se lo permitas.',
      captura: '/capturas/dashboard-profesor.png',
      alt: 'Dashboard del profesor en Futcademic con sus categorías asignadas y su próxima sesión',
    },
    {
      rol: 'Padre o madre',
      texto:
        'Ve únicamente a sus hijos: su asistencia, su próximo entrenamiento y su estado de cuenta. Recibe la notificación cuando registras su pago.',
      captura: '/capturas/dashboard-padre.png',
      alt: 'Dashboard del padre en Futcademic con sus hijos, la alerta de pago y el próximo entrenamiento',
    },
    {
      rol: 'Alumno',
      texto:
        'Tiene su propio acceso: su racha de asistencias, sus logros, su equipo y sus estadísticas. Es la parte que hace que el niño quiera venir.',
      captura: '/capturas/dashboard-alumno.png',
      alt: 'Dashboard del alumno en Futcademic con su racha de asistencias, entrenamientos del mes y logros',
    },
  ],
};

export const PRUEBA = {
  titulo: 'Lo que ya funciona hoy',
  entrada:
    'Futcademic está en beta y todavía no publicamos casos de clientes. Lo que sigue no son promesas: es lo que el sistema hace en este momento.',
  items: [
    {
      titulo: 'Los datos de tu academia son tuyos',
      texto:
        'Cada escuela vive aislada. Ninguna otra academia puede ver un alumno, un pago ni una asistencia tuya: el aislamiento se impone en la base de datos, no en la pantalla.',
    },
    {
      titulo: 'Se instala como app en el teléfono',
      texto:
        'Desde el navegador la agregas a la pantalla de inicio y abre como cualquier otra app. Funciona en Android y en iPhone sin pasar por ninguna tienda.',
    },
    {
      titulo: 'Exportas a PDF y Excel',
      texto:
        'Pagos y asistencias salen en reporte cuando los necesitas para tu contador, para una junta con padres o para tu propio control.',
    },
    {
      titulo: 'Los padres se enteran solos',
      texto:
        'Al registrar un pago, el padre recibe la notificación en su teléfono. Un mensaje menos que escribir, una discusión menos que tener.',
    },
  ],
};

export const LIMITES = {
  titulo: 'Lo que todavía no hace',
  entrada:
    'Preferimos que lo sepas ahora y no en tu segunda semana. Si algo de esto es indispensable para ti, hoy no somos tu herramienta.',
  items: [
    {
      titulo: 'No importa tu Excel de golpe',
      texto:
        'Todavía no hay carga masiva por CSV. Si tienes 200 alumnos, los das de alta a mano o nos escribes y lo vemos contigo.',
    },
    {
      titulo: 'No procesa cobros en línea',
      texto:
        'No cobramos con tarjeta ni enlazamos a un banco. Tú sigues cobrando en efectivo o por transferencia; el sistema lleva el registro y el control.',
    },
    {
      titulo: 'No valida dónde está el profesor',
      texto:
        'El pase de lista no verifica ubicación. Si necesitas comprobar que el profesor estuvo en la cancha, eso lo supervisas tú.',
    },
    {
      titulo: 'No es un chat con los padres',
      texto:
        'Las notificaciones son del sistema hacia el padre. La conversación del día a día sigue en WhatsApp.',
    },
  ],
};

export const FAQ = {
  titulo: 'Preguntas que nos hacen',
  items: [
    {
      q: '¿Cuánto cuesta?',
      a: 'Nada durante la beta. Cuando definamos el precio te avisamos con 30 días de anticipación y decides si te quedas. No pedimos tarjeta para registrarte.',
    },
    {
      q: '¿Qué necesito para empezar?',
      a: 'El nombre de tu academia, tu correo y una contraseña. Con eso creas la cuenta. Después das de alta tu primera categoría, invitas a un profesor y agregas a tus primeros alumnos.',
    },
    {
      q: '¿Cuánto tardo en tenerlo funcionando?',
      a: 'El alta toma menos de diez minutos. Tener tu academia completa cargada depende de cuántos alumnos tengas, porque hoy se capturan a mano.',
    },
    {
      q: '¿Cómo entran mis profesores y los padres?',
      a: 'Tú los invitas por correo desde el panel. Reciben una liga, ponen su contraseña y entran. No se registran por su cuenta: la academia los da de alta.',
    },
    {
      q: '¿Funciona en Android y iPhone?',
      a: 'Sí. Es una aplicación web: se abre en el navegador y se puede instalar en la pantalla de inicio del teléfono como una app normal.',
    },
    {
      q: '¿Otra academia puede ver mis datos?',
      a: 'No. Cada escuela está aislada en la base de datos. Un usuario solo alcanza información de la academia a la que pertenece.',
    },
    {
      q: '¿Qué pasa con la información de los menores?',
      a: 'Se guarda únicamente para que tu academia opere: datos del alumno, contacto de sus padres, asistencias y pagos. Nunca se vende ni se comparte con terceros.',
    },
  ],
};

export const CTA_FINAL = {
  titulo: 'Crea tu academia hoy',
  texto:
    'Diez minutos para tener a tu primera categoría dada de alta, con su profesor y sus alumnos. Gratis durante la beta.',
  cta: 'Crear mi academia gratis',
};
