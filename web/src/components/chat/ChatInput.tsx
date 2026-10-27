import { useState } from 'react';
import { ActionIcon, Group, Paper, Text, Textarea, Tooltip } from '@mantine/core';
import { IconPlayerStop, IconSend } from '@tabler/icons-react';
import classes from './chat.module.css';

export function ChatInput({
  onSend,
  onStop,
  disabled,
  streaming,
  placeholder,
  autoFocus,
}: {
  onSend: (text: string) => void;
  /** Detiene el turno en curso (aborta el stream y las herramientas). */
  onStop?: () => void;
  /** Bloquea el envío (p. ej. hay una confirmación pendiente). */
  disabled?: boolean;
  streaming?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState('');

  const submit = () => {
    const text = value.trim();
    // Mientras el asistente responde se puede escribir, pero no enviar:
    // el turno siguiente espera a que termine o se detenga.
    if (!text || disabled || streaming) return;
    onSend(text);
    setValue('');
  };

  return (
    <Paper withBorder radius="lg" className={classes.composer}>
      <Textarea
        variant="unstyled"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder={placeholder ?? 'Escribe una orden o pregunta…'}
        aria-label="Mensaje para el asistente"
        autosize
        minRows={1}
        maxRows={6}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="send"
        styles={{ input: { padding: '9px 12px 2px' } }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Group gap="xs" wrap="nowrap" px="sm" pb={5} pt={0}>
        <Text size="xs" c="dimmed" visibleFrom="sm" truncate>
          {streaming
            ? 'Puedes escribir; envía cuando termine.'
            : 'Enter envía · Shift + Enter salta de línea'}
        </Text>
        <Group gap={6} wrap="nowrap" ml="auto">
          {streaming ? (
            <Tooltip label="Detener respuesta" withArrow>
              <ActionIcon
                size={38}
                radius="md"
                variant="filled"
                color="red"
                onClick={onStop}
                aria-label="Detener respuesta"
              >
                <IconPlayerStop size={18} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Tooltip label="Enviar (Enter)" withArrow>
              <ActionIcon
                size={38}
                radius="md"
                variant="filled"
                onClick={submit}
                disabled={disabled || !value.trim()}
                aria-label="Enviar mensaje"
              >
                <IconSend size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>
    </Paper>
  );
}
