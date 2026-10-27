/**
 * Nombres humanos de las herramientas del asistente.
 *
 * Durante el stream el backend manda una etiqueta ya redactada ("Consultando
 * alumnos"); en el historial solo queda el `name` técnico. Sin este mapa la
 * conversación mostraba chips en inglés tipo "get admin dashboard".
 */
const LABELS: Record<string, string> = {
  get_admin_dashboard: 'Consultó el resumen de la academia',
  list_students: 'Consultó alumnos',
  get_student: 'Consultó la ficha de un alumno',
  get_student_stats: 'Consultó estadísticas de un alumno',
  list_categories: 'Consultó categorías',
  list_events: 'Consultó eventos',
  get_trainings_for_day: 'Consultó entrenamientos',
  list_payments: 'Consultó pagos',
  get_pending_payments: 'Consultó pagos pendientes',
  get_student_account_statement: 'Consultó un estado de cuenta',
  list_users: 'Consultó usuarios',
  list_venues: 'Consultó sedes',
  get_attendances_by_category: 'Consultó asistencias',
  create_student: 'Creó un alumno',
  update_student: 'Actualizó un alumno',
  update_student_status: 'Cambió el estado de un alumno',
  create_category: 'Creó una categoría',
  create_full_category: 'Creó una categoría con horario',
  update_category: 'Actualizó una categoría',
  create_event: 'Creó un evento',
  update_event: 'Actualizó un evento',
  cancel_training: 'Canceló un entrenamiento',
  save_attendances: 'Registró asistencias',
  create_venue: 'Creó una sede',
  update_venue: 'Actualizó una sede',
  update_school: 'Actualizó los datos de la academia',
  delete_student: 'Eliminó un alumno',
  register_student_payment: 'Registró un pago',
  register_teacher_payment: 'Registró un pago a profesor',
  delete_event: 'Eliminó un evento',
  delete_venue: 'Eliminó una sede',
  invite_teacher: 'Invitó a un profesor',
  invite_parent: 'Invitó a un padre',
  invite_admin: 'Creó un administrador',
};

export function describeToolUse(name?: string): string {
  if (!name) return 'Acción del asistente';
  const label = LABELS[name];
  if (label) return label;
  // Desconocida: al menos legible, sin guiones bajos.
  const text = name.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
