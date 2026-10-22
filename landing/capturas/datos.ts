/**
 * Datos de demostración compartidos por las capturas y el video del landing.
 * No son datos reales de ninguna academia: alimentan el arnés de mocks de
 * `web/e2e/helpers.ts`.
 */

// ── Datos de demostración ───────────────────────────────────────────────────
export const STUDENTS = [
  { id: 's1', full_name: 'Carlos López', email: 'carlos@academia.mx', birth_date: '2012-05-10', category_id: 'cat1', status: 'activo', category: { id: 'cat1', name: 'Sub-12' }, uniform_delivered: true },
  { id: 's2', full_name: 'Ana Torres', email: 'ana@academia.mx', birth_date: '2013-01-15', category_id: 'cat1', status: 'becado', category: { id: 'cat1', name: 'Sub-12' }, uniform_delivered: false },
  { id: 's3', full_name: 'Diego Ramírez', email: 'diego@academia.mx', birth_date: '2011-08-20', category_id: 'cat2', status: 'activo', category: { id: 'cat2', name: 'Sub-14' }, uniform_delivered: true },
  { id: 's4', full_name: 'Sofía Herrera', email: 'sofia@academia.mx', birth_date: '2012-11-02', category_id: 'cat1', status: 'activo', category: { id: 'cat1', name: 'Sub-12' }, uniform_delivered: true },
  { id: 's5', full_name: 'Pablo Mendoza', email: 'pablo@academia.mx', birth_date: '2011-03-28', category_id: 'cat2', status: 'activo', category: { id: 'cat2', name: 'Sub-14' }, uniform_delivered: false },
];

export const CATEGORIES = [
  { id: 'cat1', name: 'Sub-12', birth_year: '2012-2013', color: '#3498db', monthly_fee: 500, teacher_id: 't1', teacher: { id: 't1', full_name: 'Luis García' } },
  { id: 'cat2', name: 'Sub-14', birth_year: '2010-2011', color: '#e74c3c', monthly_fee: 600, teacher_id: 't2', teacher: { id: 't2', full_name: 'Marta Martínez' } },
];

export const TEACHERS = [
  { id: 't1', full_name: 'Luis García', email: 'garcia@academia.mx', role: 'profesor', phone: '55 1234 5678' },
  { id: 't2', full_name: 'Marta Martínez', email: 'martinez@academia.mx', role: 'profesor', phone: '55 8765 4321' },
];

export const VENUES = [
  { id: 'v1', name: 'Cancha Central', address: 'Av. Principal 100', surface_type: 'artificial', capacity: 60, has_lighting: true, is_covered: false },
  { id: 'v2', name: 'Campo Norte', address: 'Calle 5 #200', surface_type: 'natural', capacity: 40, has_lighting: false, is_covered: false },
];

export const hoy = new Date();
export const enDias = (n: number) => {
  const d = new Date(hoy);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const EVENTS = [
  { id: 'e1', category_id: 'cat1', date: enDias(0), start_time: '17:00', type: 'entrenamiento', venue_id: 'v1', category: { id: 'cat1', name: 'Sub-12' } },
  { id: 'e2', category_id: 'cat2', date: enDias(1), start_time: '18:00', type: 'entrenamiento', venue_id: 'v1', category: { id: 'cat2', name: 'Sub-14' } },
  { id: 'e3', category_id: 'cat1', date: enDias(3), start_time: '10:00', type: 'partido', venue_id: 'v2', category: { id: 'cat1', name: 'Sub-12' } },
  { id: 'e4', category_id: 'cat2', date: enDias(5), start_time: '17:00', type: 'entrenamiento', venue_id: 'v1', category: { id: 'cat2', name: 'Sub-14' } },
];

export const PAYMENTS = [
  { id: 'p1', type: 'mensualidad', amount: 500, payment_date: enDias(-6), description: 'Mensualidad del mes', student: STUDENTS[0] },
  { id: 'p2', type: 'mensualidad', amount: 500, payment_date: enDias(-5), description: 'Mensualidad del mes', student: STUDENTS[3] },
  { id: 'p3', type: 'mensualidad', amount: 600, payment_date: enDias(-4), description: 'Mensualidad del mes', student: STUDENTS[2] },
  { id: 'p4', type: 'pago_profesor', amount: 3000, payment_date: enDias(-2), description: 'Nómina del mes', teacher: TEACHERS[0] },
];

export const PENDING = [
  { id: 's2', full_name: 'Ana Torres', category_id: 'cat1', status: 'activo', category: { name: 'Sub-12', monthly_fee: 500 }, monthly_fee: 500, paid_amount: 0, pending_amount: 500, is_fully_paid: false },
  { id: 's5', full_name: 'Pablo Mendoza', category_id: 'cat2', status: 'activo', category: { name: 'Sub-14', monthly_fee: 600 }, monthly_fee: 600, paid_amount: 300, pending_amount: 300, is_fully_paid: false },
];

export const NOTIFS = [
  { id: 'n1', title: 'Pago registrado', body: 'Carlos López — $500 mensualidad', is_read: false, created_at: new Date().toISOString() },
  { id: 'n2', title: 'Nuevo alumno', body: 'Sofía Herrera se registró en Sub-12', is_read: false, created_at: new Date(Date.now() - 3_600_000).toISOString() },
];

export const ACHIEVEMENTS = {
  achievements: [
    { id: 'a1', name: 'Primera clase', description: 'Asiste a tu primer entrenamiento', icon: '⚽', unlocked: true, unlocked_at: enDias(-120) },
    { id: 'a2', name: 'Racha de 5', description: '5 asistencias consecutivas', icon: '🔥', unlocked: true, unlocked_at: enDias(-60) },
    { id: 'a3', name: 'Racha de 10', description: '10 asistencias consecutivas', icon: '💪', unlocked: false, unlocked_at: null },
    { id: 'a4', name: 'Goleador', description: 'Anota en 3 partidos seguidos', icon: '🏆', unlocked: true, unlocked_at: enDias(-30) },
    { id: 'a5', name: 'Mes perfecto', description: 'Asiste a todos los entrenamientos del mes', icon: '⭐', unlocked: true, unlocked_at: enDias(-10) },
    { id: 'a6', name: 'MVP', description: 'Nominado como mejor jugador', icon: '👑', unlocked: false, unlocked_at: null },
  ],
  unlockedCount: 4,
  totalCount: 6,
};

export const DASH = {
  admin: { activeStudents: 5, totalStudents: 5, monthlyIncome: 4600, pendingPayments: 2, attendanceRate: 91.4, upcomingEvents: EVENTS },
  profesor: { categoriesCount: 1, myCategories: [CATEGORIES[0]], nextSession: 'Hoy 17:00 — Cancha Central', todayTrainings: [EVENTS[0]] },
  padre: { children: [STUDENTS[0]], paymentAlert: 'Carlos tiene 1 pago pendiente de este mes.', nextTraining: 'Hoy 17:00 — Cancha Central' },
  alumno: { studentName: 'Carlos López', category: 'Sub-12', currentStreak: 7, trainingsThisMonth: 10, achievementsUnlocked: 4, nextTraining: 'Hoy 17:00 — Cancha Central' },
};

export const API = {
  students: STUDENTS,
  categories: CATEGORIES,
  teachers: TEACHERS,
  users: [...TEACHERS, { id: 'padre-1', full_name: 'María López', email: 'maria@correo.mx', role: 'padre' }],
  venues: VENUES,
  events: EVENTS,
  trainings: EVENTS.filter((e) => e.type === 'entrenamiento'),
  payments: PAYMENTS,
  pendingPayments: PENDING,
  notifications: NOTIFS,
  achievements: ACHIEVEMENTS,
  permissions: { can_take_attendance: true, can_manage_events: true, can_view_finances: false, can_manage_students: true, can_manage_payments: false, can_manage_categories: false },
  dashboards: DASH,
};

/** Marca el perfil como onboardeado: si no, AuthGate manda a /onboarding. */
export const ONBOARDED = '2026-01-15T10:00:00.000Z';
