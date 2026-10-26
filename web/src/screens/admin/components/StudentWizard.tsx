import { useState } from 'react';
import {
  Modal,
  Stepper,
  Stack,
  TextInput,
  Select,
  Button,
  Group,
  SegmentedControl,
  Text,
  Card,
  Badge,
  Alert,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconMail } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useCreateStudent } from '../../../hooks/useStudents';
import { useInviteParent } from '../../../hooks/useUsers';

type ParentMode = 'ninguno' | 'existente' | 'nuevo';

type Props = {
  opened: boolean;
  onClose: () => void;
  categories: any[];
  parents: any[];
};

export function StudentWizard({ opened, onClose, categories, parents }: Props) {
  const [step, setStep] = useState(0);
  const [parentMode, setParentMode] = useState<ParentMode>('ninguno');
  const create = useCreateStudent();
  const inviteParent = useInviteParent();

  const studentForm = useForm({
    initialValues: {
      full_name: '',
      birth_date: new Date(),
      email: '',
      category_id: '',
    },
    validate: {
      full_name: (v) => (v.trim() ? null : 'Requerido'),
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Correo inválido'),
      category_id: (v) => (v ? null : 'Requerido'),
    },
  });

  const parentForm = useForm({
    initialValues: {
      existing_parent_id: '',
      new_parent_name: '',
      new_parent_email: '',
      new_parent_phone: '',
    },
    validate: {
      existing_parent_id: (v) =>
        parentMode === 'existente' && !v ? 'Selecciona un padre/tutor' : null,
      new_parent_name: (v) =>
        parentMode === 'nuevo' && !v.trim() ? 'Requerido' : null,
      new_parent_email: (v) =>
        parentMode === 'nuevo' && !/^\S+@\S+\.\S+$/.test(v) ? 'Correo inválido' : null,
    },
  });

  const reset = () => {
    setStep(0);
    setParentMode('ninguno');
    studentForm.reset();
    parentForm.reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const nextFromStudent = () => {
    if (!studentForm.validate().hasErrors) setStep(1);
  };

  const nextFromParent = () => {
    if (!parentForm.validate().hasErrors) setStep(2);
  };

  const onConfirm = async () => {
    try {
      let parentId: string | null = null;

      if (parentMode === 'existente') {
        parentId = parentForm.values.existing_parent_id || null;
      } else if (parentMode === 'nuevo') {
        const { userId } = await inviteParent.mutateAsync({
          email: parentForm.values.new_parent_email.trim(),
          fullName: parentForm.values.new_parent_name.trim(),
          phone: parentForm.values.new_parent_phone || undefined,
        });
        parentId = userId;
      }

      await create.mutateAsync({
        full_name: studentForm.values.full_name.trim(),
        birth_date: dayjs(studentForm.values.birth_date).format('YYYY-MM-DD'),
        email: studentForm.values.email.trim(),
        category_id: studentForm.values.category_id,
        parent_id: parentId,
      });

      notifications.show({
        color: 'green',
        message:
          parentMode === 'nuevo'
            ? 'Alumno creado. Se envió la invitación por correo al padre/tutor.'
            : 'Alumno creado',
      });
      handleClose();
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: e?.response?.data?.error || 'Error al registrar al alumno',
      });
    }
  };

  const selectedCategory = categories.find(
    (c: any) => c.id === studentForm.values.category_id,
  );
  const selectedParent = parents.find(
    (p: any) => p.id === parentForm.values.existing_parent_id,
  );

  return (
    <Modal opened={opened} onClose={handleClose} title="Nuevo alumno" centered size="lg">
      <Stepper active={step} size="sm" mb="md">
        <Stepper.Step label="Alumno" description="Datos básicos">
          <Stack mt="md">
            <TextInput label="Nombre completo" required {...studentForm.getInputProps('full_name')} />
            <DateInput label="Fecha de nacimiento" required {...studentForm.getInputProps('birth_date')} />
            <TextInput label="Correo" type="email" required {...studentForm.getInputProps('email')} />
            <Select
              label="Categoría"
              required
              data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
              {...studentForm.getInputProps('category_id')}
            />
            <Group justify="flex-end">
              <Button onClick={nextFromStudent}>Siguiente</Button>
            </Group>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Padre/Tutor" description="Contacto">
          <Stack mt="md">
            <SegmentedControl
              fullWidth
              value={parentMode}
              onChange={(v) => setParentMode(v as ParentMode)}
              data={[
                { value: 'ninguno', label: 'Sin padre/tutor' },
                { value: 'existente', label: 'Elegir existente' },
                { value: 'nuevo', label: 'Registrar nuevo' },
              ]}
            />
            {parentMode === 'existente' && (
              <Select
                label="Padre/Tutor"
                searchable
                required
                data={parents.map((p: any) => ({ value: p.id, label: p.full_name }))}
                {...parentForm.getInputProps('existing_parent_id')}
              />
            )}
            {parentMode === 'nuevo' && (
              <>
                <TextInput label="Nombre completo" required {...parentForm.getInputProps('new_parent_name')} />
                <TextInput label="Correo" type="email" required {...parentForm.getInputProps('new_parent_email')} />
                <TextInput label="Teléfono (opcional)" {...parentForm.getInputProps('new_parent_phone')} />
                <Alert variant="light" icon={<IconMail size={16} />}>
                  Al finalizar se enviará una invitación por correo para que el
                  padre/tutor active su cuenta y cree su contraseña.
                </Alert>
              </>
            )}
            <Group justify="space-between">
              <Button variant="default" onClick={() => setStep(0)}>
                Atrás
              </Button>
              <Button onClick={nextFromParent}>Siguiente</Button>
            </Group>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Confirmar" description="Resumen">
          <Stack mt="md">
            <Card withBorder radius="md" padding="md">
              <Text size="sm" fw={600} mb={4}>
                Alumno
              </Text>
              <Text size="sm">{studentForm.values.full_name}</Text>
              <Text size="xs" c="dimmed">
                {studentForm.values.email} ·{' '}
                {dayjs(studentForm.values.birth_date).format('DD/MM/YYYY')}
              </Text>
              {selectedCategory && (
                <Badge variant="light" mt={6}>
                  {selectedCategory.name}
                </Badge>
              )}
            </Card>
            <Card withBorder radius="md" padding="md">
              <Text size="sm" fw={600} mb={4}>
                Padre/Tutor
              </Text>
              {parentMode === 'ninguno' && (
                <Text size="sm" c="dimmed">
                  Sin padre/tutor asignado
                </Text>
              )}
              {parentMode === 'existente' && (
                <Text size="sm">{selectedParent?.full_name || '—'}</Text>
              )}
              {parentMode === 'nuevo' && (
                <>
                  <Text size="sm">{parentForm.values.new_parent_name}</Text>
                  <Text size="xs" c="dimmed">
                    {parentForm.values.new_parent_email}
                  </Text>
                  <Badge variant="light" color="blue" mt={6} leftSection={<IconMail size={12} />}>
                    Se invitará por correo
                  </Badge>
                </>
              )}
            </Card>
            <Group justify="space-between">
              <Button variant="default" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button onClick={onConfirm} loading={create.isPending || inviteParent.isPending}>
                Registrar alumno
              </Button>
            </Group>
          </Stack>
        </Stepper.Step>
      </Stepper>
    </Modal>
  );
}
