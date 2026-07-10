import { useState } from 'react';
import { ActionIcon, Group, Textarea } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';

export function ChatInput({
  onSend,
  disabled,
  placeholder,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState('');

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
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
      <ActionIcon size="lg" variant="filled" onClick={submit} disabled={disabled || !value.trim()}>
        <IconSend size={18} />
      </ActionIcon>
    </Group>
  );
}
