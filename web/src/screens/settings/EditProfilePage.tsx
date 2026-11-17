import { Card, Stack, TextInput, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useUpdateOwnProfile } from '../../hooks/useMe';
import { useRemoveAvatar, useUploadAvatar } from '../../hooks/useUpload';
import { PageHeader } from '../../components/common/PageHeader';
import { PhotoUploader } from '../../components/common/PhotoUploader';

export function EditProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const update = useUpdateOwnProfile();
  const upload = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();

  // La foto se guarda sola al subirla; el formulario solo refleja la URL nueva.
  const handleAvatarUpload = async (file: File) => {
    if (!profile?.id) return;
    const { avatarUrl } = await upload.mutateAsync({ file, userId: profile.id });
    form.setFieldValue('avatar_url', avatarUrl);
    await refreshProfile();
    notifications.show({ color: 'green', message: 'Foto actualizada' });
  };

  const handleAvatarRemove = async () => {
    if (!profile?.id) return;
    await removeAvatar.mutateAsync({ userId: profile.id });
    form.setFieldValue('avatar_url', '');
    await refreshProfile();
    notifications.show({ color: 'green', message: 'Foto quitada' });
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
            <PhotoUploader
              src={form.values.avatar_url}
              name={profile?.full_name}
              size={84}
              onUpload={handleAvatarUpload}
              onRemove={handleAvatarRemove}
            />
            <Button type="submit" loading={update.isPending}>
              Guardar
            </Button>
          </Stack>
        </form>
      </Card>
    </>
  );
}
