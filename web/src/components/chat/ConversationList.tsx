import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Box,
  Center,
  Group,
  Menu,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconDots, IconMessage, IconSearch, IconTrash, IconX } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { Conversation } from '../../hooks/useChat';
import classes from './chat.module.css';

const timeFormat = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });
const shortDateFormat = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });

const GROUPS = ['Hoy', 'Ayer', 'Últimos 7 días', 'Anteriores'] as const;
type Group = (typeof GROUPS)[number];

/** Agrupa por cercanía: una lista plana de 40 títulos no dice nada. */
function groupOf(iso: string): Group {
  const updated = dayjs(iso);
  if (!updated.isValid()) return 'Anteriores';
  const today = dayjs().startOf('day');
  if (!updated.isBefore(today)) return 'Hoy';
  if (!updated.isBefore(today.subtract(1, 'day'))) return 'Ayer';
  if (!updated.isBefore(today.subtract(6, 'day'))) return 'Últimos 7 días';
  return 'Anteriores';
}

function subtitle(iso: string) {
  const updated = new Date(iso);
  if (Number.isNaN(updated.getTime())) return '';
  return dayjs(updated).isSame(dayjs(), 'day')
    ? timeFormat.format(updated)
    : shortDateFormat.format(updated);
}

export function ConversationList({
  conversations,
  loading,
  activeId,
  onSelect,
  onDelete,
  onNavigate,
}: {
  conversations: Conversation[];
  loading: boolean;
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  /** Se dispara al elegir una conversación (para cerrar el drawer móvil). */
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle
      ? conversations.filter((c) => (c.title ?? '').toLowerCase().includes(needle))
      : conversations;
    return [...list].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [conversations, query]);

  const grouped = useMemo(() => {
    const buckets = new Map<Group, Conversation[]>();
    for (const conversation of filtered) {
      const group = groupOf(conversation.updated_at);
      const list = buckets.get(group);
      if (list) list.push(conversation);
      else buckets.set(group, [conversation]);
    }
    return GROUPS.filter((g) => buckets.has(g)).map((g) => ({
      label: g,
      items: buckets.get(g)!,
    }));
  }, [filtered]);

  const confirmDelete = (conversation: Conversation) => {
    const title = conversation.title || 'esta conversación';
    modals.openConfirmModal({
      title: 'Eliminar conversación',
      centered: true,
      children: (
        <Text size="sm">
          Se eliminará «{title}» y todo su historial. Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: () => onDelete(conversation.id),
    });
  };

  return (
    <Stack gap="xs" h="100%" style={{ minHeight: 0 }}>
      <TextInput
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        placeholder="Buscar conversación"
        aria-label="Buscar conversaciones"
        size="xs"
        radius="md"
        leftSection={<IconSearch size={14} />}
        rightSection={
          query ? (
            <UnstyledButton
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
              style={{ display: 'flex', padding: 4 }}
            >
              <IconX size={13} />
            </UnstyledButton>
          ) : undefined
        }
      />

      <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars>
        {loading ? (
          <Stack gap={6}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={46} radius="md" />
            ))}
          </Stack>
        ) : conversations.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap={6} px="sm">
              <ThemeIcon variant="light" color="gray" size={40} radius="xl">
                <IconMessage size={20} />
              </ThemeIcon>
              <Text size="sm" fw={600} ta="center">
                Aún no hay conversaciones
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                Empieza con una pregunta y quedará guardada aquí.
              </Text>
            </Stack>
          </Center>
        ) : grouped.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center" py="lg">
            Sin resultados para «{query}».
          </Text>
        ) : (
          <Stack gap="md" pb="xs">
            {grouped.map((group) => (
              <Box key={group.label}>
                <Text size="10px" c="dimmed" tt="uppercase" fw={700} px={8} pb={4}>
                  {group.label}
                </Text>
                <Stack gap={2}>
                  {group.items.map((conversation) => {
                    const active = conversation.id === activeId;
                    const title = conversation.title || 'Conversación sin título';
                    return (
                      <Group
                        key={conversation.id}
                        gap={0}
                        wrap="nowrap"
                        className={classes.convRow}
                        data-active={active}
                      >
                        <UnstyledButton
                          className={classes.convMain}
                          onClick={() => {
                            onSelect(conversation.id);
                            onNavigate?.();
                          }}
                          aria-label={`Conversación: ${title}`}
                          aria-current={active ? 'true' : undefined}
                        >
                          <IconMessage size={16} className={classes.convIcon} />
                          <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text size="sm" fw={active ? 600 : 500} lineClamp={2} lh={1.25}>
                              {title}
                            </Text>
                            <Text size="xs" c="dimmed" truncate mt={2}>
                              {subtitle(conversation.updated_at)}
                            </Text>
                          </Box>
                        </UnstyledButton>

                        <Menu position="bottom-end" shadow="md" width={210} withArrow>
                          <Menu.Target>
                            <ActionIcon
                              size={32}
                              variant="subtle"
                              color="gray"
                              className={classes.convAction}
                              aria-label={`Opciones de «${title}»`}
                            >
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={() => confirmDelete(conversation)}
                            >
                              Eliminar conversación
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Stack>
  );
}
