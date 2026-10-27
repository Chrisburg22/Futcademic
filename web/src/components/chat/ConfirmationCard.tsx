import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Collapse,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconAlertTriangle, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type { PendingAction } from '../../api/chatStream';

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

const longDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
const monthYear = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' });

/** Claves que no aportan nada al humano: el resumen ya resolvió los nombres. */
const HIDDEN_KEYS = new Set([
  'id',
  'user_id',
  'school_id',
  'tool_use_id',
  'student_id',
  'student_ids',
  'teacher_id',
  'event_id',
  'venue_id',
  'category_id',
]);

const LABELS: Record<string, string> = {
  amount: 'Monto',
  payment_month: 'Mes',
  payment_type: 'Tipo de pago',
  description: 'Concepto',
  method: 'Método',
  reference: 'Referencia',
  notes: 'Notas',
  full_name: 'Nombre',
  email: 'Correo',
  phone: 'Teléfono',
  date: 'Fecha',
  start_time: 'Hora de inicio',
  end_time: 'Hora de fin',
  name: 'Nombre',
  role: 'Rol',
  category_name: 'Categoría',
  venue_name: 'Sede',
  event_name: 'Evento',
  student_name: 'Alumno',
  teacher_name: 'Profesor',
  status: 'Estado',
};

function isDestructive(name: string) {
  return name.startsWith('delete_');
}

function formatValue(key: string, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;

  if (Array.isArray(value)) {
    const parts = value.map((v) => formatValue(key, v)).filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }

  if (typeof value === 'boolean') return value ? 'Sí' : 'No';

  if (key === 'amount') {
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(n)) return currency.format(n);
  }

  if (typeof value === 'string') {
    if (key === 'payment_month' && /^\d{4}-\d{2}$/.test(value)) {
      return monthYear.format(new Date(`${value}-15T12:00:00`));
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return longDate.format(new Date(`${value}T12:00:00`));
    }
    return value;
  }

  if (typeof value === 'object') return null;

  return String(value);
}

function ActionDetails({ input }: { input: Record<string, unknown> }) {
  const rows = Object.entries(input)
    .filter(([key]) => !HIDDEN_KEYS.has(key))
    .map(([key, value]) => ({ key, text: formatValue(key, value) }))
    .filter((row): row is { key: string; text: string } => !!row.text);

  if (rows.length === 0) return null;

  return (
    <Stack gap={2} mt={4}>
      {rows.map((row) => (
        <Text key={row.key} size="xs" c="dimmed">
          <Text span fw={600} size="xs" c="dimmed">
            {LABELS[row.key] ?? row.key.replace(/_/g, ' ')}:
          </Text>{' '}
          {row.text}
        </Text>
      ))}
    </Stack>
  );
}

function ActionRow({ action }: { action: PendingAction }) {
  const [showDetails, setShowDetails] = useState(false);
  const destructive = isDestructive(action.name);

  return (
    <Stack gap={2}>
      <Group gap="xs" wrap="nowrap" align="flex-start">
        <Text size="sm" fw={600} style={{ flex: 1 }}>
          {action.summary || action.label}
        </Text>
        {destructive && (
          <Badge color="red" variant="light" size="xs" style={{ flexShrink: 0 }}>
            Irreversible
          </Badge>
        )}
      </Group>

      {action.impact && (
        <Text size="xs" c="dimmed">
          {action.impact}
        </Text>
      )}

      <Group gap={4}>
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          onClick={() => setShowDetails((v) => !v)}
          rightSection={showDetails ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
        >
          {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
        </Button>
      </Group>

      <Collapse in={showDetails}>
        <ActionDetails input={action.input} />
      </Collapse>
    </Stack>
  );
}

/**
 * Confirmación de acciones sensibles. El resumen lo redacta el servidor
 * (`chat/describe.ts`) con nombres y montos reales; aquí solo se presenta.
 */
export function ConfirmationCard({
  actions,
  onRespond,
  disabled,
}: {
  actions: PendingAction[];
  onRespond: (approved: boolean) => void;
  disabled?: boolean;
}) {
  const destructive = actions.some((a) => isDestructive(a.name));
  const multiple = actions.length > 1;

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      bg="var(--mantine-color-yellow-light)"
      style={{ borderColor: 'var(--mantine-color-yellow-4)' }}
      role="group"
      aria-label="Confirmación de acciones del asistente"
    >
      <Stack gap="sm">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size={28} radius="md" variant="light" color="yellow" aria-hidden>
            <IconAlertTriangle size={16} />
          </ThemeIcon>
          <Text fw={600} size="sm">
            {multiple
              ? `El asistente quiere ejecutar ${actions.length} acciones`
              : destructive
                ? 'El asistente quiere eliminar algo'
                : 'El asistente necesita tu confirmación'}
          </Text>
        </Group>

        <Stack gap="md">
          {actions.map((action) => (
            <ActionRow key={action.tool_use_id} action={action} />
          ))}
        </Stack>

        <Text size="xs" c="dimmed">
          Nada se ha modificado todavía. Revisa y confirma, o cancela para descartarlo.
        </Text>

        <Group justify="flex-end" gap="sm">
          <Button variant="default" size="md" onClick={() => onRespond(false)} disabled={disabled}>
            Cancelar
          </Button>
          <Button
            color={destructive ? 'red' : 'blue'}
            size="md"
            onClick={() => onRespond(true)}
            disabled={disabled}
          >
            {destructive ? 'Sí, continuar' : 'Confirmar'}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
