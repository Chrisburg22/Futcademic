import { Card, Stack, TextInput, Button, Group, Avatar, FileButton, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUpdateOwnProfile } from '../../hooks/useMe';
import { useUploadAvatar } from '../../hooks/useUpload';
import { PageHeader } from '../../components/common/PageHeader';

export function EditProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const update = useUpdateOwnProfile();
  const upload = useUploadAvatar();

  const handleAvatarUpload = async (file: File | null) => {
    if (!file || !profile?.id) return;
    const { avatarUrl } = await upload.mutateAsync({ file, userId: profile.id });
    form.setFieldValue('avatar_url', avatarUrl);
    notifications.show({ color: 'green', message: 'Foto subida' });
  };

  const form = useForm({
    initialValues: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      emergency_contact_name: profile?.emergency_contact_name || '',
      emergency_contact_phone: profile?.emergency_contact_phone || '',
      avatar_url: profile?.avatar_url || '',
    },
  });

  const onSubmit = async (v: typeof form.values) => {
    if (!profile?.id) return;
    await update.mutateAsync({
      fullName: v.full_name,
      phone: v.phone,
      address: v.address,
      emergency_contact_name: v.emergency_contact_name,
      emergency_contact_phone: v.emergency_contact_phone,
      avatar_url: v.avatar_url,
    });
    await refreshProfile();
    notifications.show({ color: 'green', message: 'Perfil actualizado' });
  };

  return (
    <>
      <PageHeader title="Mi perfil" />
      <Card withBorder padding="lg" radius="md" maw={700}>
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack>
            <TextInput label="Nombre completo" required {...form.getInputProps('full_name')} />
            <Group grow>
              <TextInput label="Teléfono" {...form.getInputProps('phone')} />
              <TextInput label="Dirección" {...form.getInputProps('address')} />
            </Group>
            <Group grow>
              <TextInput
                label="Contacto de emergencia"
                {...form.getInputProps('emergency_contact_name')}
              />
              <TextInput
                label="Tel. emergencia"
                {...form.getInputProps('emergency_contact_phone')}
              />
            </Group>
            <Group gap="sm">
              <Avatar size="lg" radius="xl" src={form.values.avatar_url || undefined}>
                {profile?.full_name?.[0]?.toUpperCase()}
              </Avatar>
              <Stack gap={4}>
                <FileButton onChange={handleAvatarUpload} accept="image/*">
                  {(props) => (
                    <Button
                      variant="light"
                      size="xs"
                      leftSection={<IconUpload size={14} />}
                      loading={upload.isPending}
                      {...props}
                    >
                      Subir foto
                    </Button>
                  )}
                </FileButton>
                <Text size="xs" c="dimmed">
                  JPG, PNG — max 2 MB
                </Text>
              </Stack>
            </Group>
            <TextInput label="URL de avatar" {...form.getInputProps('avatar_url')} />
            <Button type="submit" loading={update.isPending}>
              Guardar
            </Button>
          </Stack>
        </form>
      </Card>
    </>
  );
}
