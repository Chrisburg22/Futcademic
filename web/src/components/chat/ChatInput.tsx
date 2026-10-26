import { useState } from 'react';
import { ActionIcon, Group, Textarea, Tooltip } from '@mantine/core';
import { IconPlayerStop, IconSend } from '@tabler/icons-react';

export function ChatInput({
  onSend,
  onStop,
  disabled,
  streaming,
  placeholder,
}: {
  onSend: (text: string) => void;
  /** Detiene el turno en curso (aborta el stream y las herramientas). */
  onStop?: () => void;
  /** Bloquea el envío (p. ej. hay una confirmación pendiente). */
  disabled?: boolean;
  streaming?: boolean;
  placeholder?: string;
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
    <Group gap="xs" align="flex-end" wrap="nowrap">
      <Textarea
        style={{ flex: 1 }}
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder={placeholder ?? 'Escribe una orden o pregunta…'}
        autosize
        minRows={1}
        maxRows={5}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      {streaming ? (
        <Tooltip label="Detener respuesta">
          <ActionIcon
            size="lg"
            variant="filled"
            color="red"
            onClick={onStop}
            aria-label="Detener respuesta"
          >
            <IconPlayerStop size={18} />
          </ActionIcon>
        </Tooltip>
      ) : (
        <Tooltip label="Enviar (Enter)">
          <ActionIcon
            size="lg"
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
  );
}
