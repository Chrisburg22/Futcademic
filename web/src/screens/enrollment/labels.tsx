import { Badge } from '@mantine/core';

type BadgeMeta = { label: string; color: string };

const STATUS: Record<string, BadgeMeta> = {
  // Solicitudes
  borrador: { label: 'Borrador', color: 'gray' },
  enviada: { label: 'Enviada', color: 'blue' },
  en_revision: { label: 'En revisión', color: 'yellow' },
  aprobada: { label: 'Aprobada', color: 'green' },
  rechazada: { label: 'Rechazada', color: 'red' },
  // Links
  activa: { label: 'Activo', color: 'green' },
  expirada: { label: 'Expirado', color: 'gray' },
  revocada: { label: 'Revocado', color: 'red' },
  usada: { label: 'Usado', color: 'gray' },
  // Expediente
  sin_tutor: { label: 'Sin tutor', color: 'gray' },
  incompleto: { label: 'Incompleto', color: 'orange' },
  completo: { label: 'Completo', color: 'green' },
  // Documentos
  pendiente: { label: 'Pendiente', color: 'yellow' },
  validado: { label: 'Validado', color: 'green' },
  rechazado: { label: 'Rechazado', color: 'red' },
  vencido: { label: 'Vencido', color: 'red' },
};

export function enrollmentStatusMeta(status?: string | null): BadgeMeta {
  if (!status) return { label: '—', color: 'gray' };
  return STATUS[status] || { label: status, color: 'gray' };
}

export function EnrollmentStatusBadge({
  status,
  size = 'sm',
}: {
  status?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const meta = enrollmentStatusMeta(status);
  return (
    <Badge color={meta.color} variant="light" size={size}>
      {meta.label}
    </Badge>
  );
}

export const RELATIONSHIP_OPTIONS = [
  { value: 'madre', label: 'Madre' },
  { value: 'padre', label: 'Padre' },
  { value: 'tutor_legal', label: 'Tutor legal' },
  { value: 'abuelo', label: 'Abuelo/a' },
  { value: 'otro', label: 'Otro' },
];

export const APPLICATION_STATUS_OPTIONS = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
];

export function relationshipLabel(value?: string | null): string {
  if (!value) return '—';
  return RELATIONSHIP_OPTIONS.find((r) => r.value === value)?.label || value;
}
