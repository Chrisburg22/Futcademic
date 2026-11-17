import { Card, Stack, TextInput, Button } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useUpdateAcademy } from '../../hooks/useSettings';
import { useUploadLogo } from '../../hooks/useUpload';
import { PageHeader } from '../../components/common/PageHeader';
import { PhotoUploader } from '../../components/common/PhotoUploader';

export function EditAcademyPage() {
  const { profile, refreshProfile } = useAuth();
  const update = useUpdateAcademy();
  const uploadLogo = useUploadLogo();

  const form = useForm({
    initialValues: {
      name: profile?.school?.name || '',
      logo_url: profile?.school?.logo_url || '',
    },
  });

  // El logo ya queda guardado en la escuela al subirlo; el formulario solo
  // refleja la URL nueva para que se vea sin recargar.
  const handleLogoUpload = async (file: File) => {
    const { logoUrl } = await uploadLogo.mutateAsync(file);
    form.setFieldValue('logo_url', logoUrl);
    await refreshProfile();
    notifications.show({ color: 'green', message: 'Logo actualizado' });
  };

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
            <PhotoUploader
              variant="image"
              src={form.values.logo_url}
              name={form.values.name}
              size={72}
              label="Subir logo"
              hint="Logo de la academia — JPG, PNG o WEBP"
              onUpload={handleLogoUpload}
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
