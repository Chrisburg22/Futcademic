import { Card, Stack, TextInput, Button, Group, Image, FileButton, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUpdateAcademy } from '../../hooks/useSettings';
import { useUploadLogo } from '../../hooks/useUpload';
import { PageHeader } from '../../components/common/PageHeader';

export function EditAcademyPage() {
  const { profile, refreshProfile } = useAuth();
  const update = useUpdateAcademy();
  const uploadLogo = useUploadLogo();

  const handleLogoUpload = async (file: File | null) => {
    if (!file) return;
    const { logoUrl } = await uploadLogo.mutateAsync(file);
    form.setFieldValue('logo_url', logoUrl);
    notifications.show({ color: 'green', message: 'Logo subido' });
  };

  const form = useForm({
    initialValues: {
      name: profile?.school?.name || '',
      logo_url: profile?.school?.logo_url || '',
    },
  });

  const onSubmit = async (v: typeof form.values) => {
    if (!profile?.school_id) return;
    await update.mutateAsync({
      id: profile.school_id,
      name: v.name,
      logo_url: v.logo_url || undefined,
    });
    await refreshProfile();
    notifications.show({ color: 'green', message: 'Academia actualizada' });
  };

  return (
    <>
      <PageHeader title="Datos de la academia" />
      <Card withBorder padding="lg" radius="md" maw={600}>
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack>
            <TextInput label="Nombre" required {...form.getInputProps('name')} />
            <Group gap="sm">
              {form.values.logo_url && (
                <Image src={form.values.logo_url} h={48} w={48} radius="sm" alt="logo" />
              )}
              <Stack gap={4}>
                <FileButton onChange={handleLogoUpload} accept="image/*">
                  {(props) => (
                    <Button
                      variant="light"
                      size="xs"
                      leftSection={<IconUpload size={14} />}
                      loading={uploadLogo.isPending}
                      {...props}
                    >
                      Subir logo
                    </Button>
                  )}
                </FileButton>
                <Text size="xs" c="dimmed">
                  JPG, PNG — max 2 MB
                </Text>
              </Stack>
            </Group>
            <TextInput label="URL del logo" {...form.getInputProps('logo_url')} />
            <Button type="submit" loading={update.isPending}>
              Guardar
            </Button>
          </Stack>
        </form>
      </Card>
    </>
  );
}
