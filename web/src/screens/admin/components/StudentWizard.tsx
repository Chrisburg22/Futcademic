'use client';

import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CopyButton,
  FileButton,
  Group,
  Modal,
  SegmentedControl,
  Select,
  Stack,
  Stepper,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconBrandWhatsapp,
  IconCheck,
  IconCopy,
  IconFileText,
  IconMail,
  IconShieldCheck,
  IconUpload,
} from '@tabler/icons-react';
import { BottomSheet } from '../../../components/common/BottomSheet';
import { BirthDateInput } from '../../../components/common/BirthDateInput';
import dayjs from 'dayjs';
import { useCreateStudent } from '../../../hooks/useStudents';
import { useInviteParent } from '../../../hooks/useUsers';
import { useCreateStudentConsent, useUploadStudentDocument } from '../../../hooks/useExpediente';
import {
  useCreateEnrollmentInvitation,
  useGetConsentTemplate,
} from '../../../hooks/useEnrollment';
import { useAuth } from '../../../contexts/AuthContext';
import { ConsentCaptureForm, type ConsentPayload } from '../../enrollment/ConsentCaptureForm';
import { RELATIONSHIP_OPTIONS } from '../../enrollment/labels';

type ParentMode = 'ninguno' | 'existente' | 'nuevo';

type PendingDoc = {
  doc_type: string;
  owner_type: 'alumno' | 'tutor';
  label: string;
  file: File;
};

const DOC_CAPTURE_OPTIONS: Array<{
  doc_type: string;
  owner_type: 'alumno' | 'tutor';
  label: string;
  hint?: string;
}> = [
  {
    doc_type: 'identificacion_tutor_frente',
    owner_type: 'tutor',
    label: 'Identificación del tutor (frente)',
    hint: 'Recomendado para aprobar la inscripción',
  },
  {
    doc_type: 'identificacion_tutor_reverso',
    owner_type: 'tutor',
    label: 'Identificación del tutor (reverso)',
    hint: 'Recomendado para aprobar la inscripción',
  },
  { doc_type: 'acta_nacimiento', owner_type: 'alumno', label: 'Acta de nacimiento' },
  { doc_type: 'curp', owner_type: 'alumno', label: 'CURP' },
  { doc_type: 'comprobante_domicilio', owner_type: 'alumno', label: 'Comprobante de domicilio' },
  { doc_type: 'certificado_medico', owner_type: 'alumno', label: 'Certificado médico' },
  { doc_type: 'foto_alumno', owner_type: 'alumno', label: 'Foto del alumno' },
];

type Props = {
  opened: boolean;
  onClose: () => void;
  categories: any[];
  parents: any[];
};

export function StudentWizard({ opened, onClose, categories, parents }: Props) {
  const [step, setStep] = useState(0);
  const [parentMode, setParentMode] = useState<ParentMode>('ninguno');
  const [consent, setConsent] = useState<ConsentPayload | null>(null);
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [linkResult, setLinkResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const create = useCreateStudent();
  const inviteParent = useInviteParent();
  const createConsent = useCreateStudentConsent();
  const uploadDoc = useUploadStudentDocument();
  const createInvitation = useCreateEnrollmentInvitation();
  const { data: template } = useGetConsentTemplate();
  const { profile } = useAuth();

  const studentForm = useForm({
    initialValues: {
      full_name: '',
      birth_date: new Date(),
      email: '',
      category_id: '',
      curp: '',
      phone: '',
      address: '',
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
      relationship: '',
    },
    validate: {
      existing_parent_id: (v) =>
        parentMode === 'existente' && !v ? 'Selecciona un padre/tutor' : null,
      new_parent_name: (v) =>
        parentMode === 'nuevo' && !v.trim() ? 'Requerido' : null,
      new_parent_email: (v) =>
        parentMode === 'nuevo' && !/^\S+@\S+\.\S+$/.test(v) ? 'Correo inválido' : null,
      new_parent_phone: (v) =>
        parentMode === 'nuevo' && !v.trim() ? 'El celular es obligatorio' : null,
    },
  });

  const reset = () => {
    setStep(0);
    setParentMode('ninguno');
    setConsent(null);
    setPendingDocs([]);
    setLinkResult(null);
    setSubmitting(false);
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

  const selectedParent = parents.find(
    (p: any) => p.id === parentForm.values.existing_parent_id,
  );
  const selectedCategory = categories.find(
    (c: any) => c.id === studentForm.values.category_id,
  );
  const guardianName =
    parentMode === 'nuevo'
      ? parentForm.values.new_parent_name
      : parentMode === 'existente'
        ? selectedParent?.full_name || ''
        : '';

  const setPendingFile = (option: (typeof DOC_CAPTURE_OPTIONS)[number], file: File) => {
    setPendingDocs((prev) => [
      ...prev.filter((doc) => doc.doc_type !== option.doc_type),
      { ...option, file },
    ]);
  };

  const removePendingFile = (docType: string) => {
    setPendingDocs((prev) => prev.filter((doc) => doc.doc_type !== docType));
  };

  const onConfirm = async () => {
    setSubmitting(true);
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

      const created = await create.mutateAsync({
        full_name: studentForm.values.full_name.trim(),
        birth_date: dayjs(studentForm.values.birth_date).format('YYYY-MM-DD'),
        email: studentForm.values.email.trim(),
        category_id: studentForm.values.category_id,
        parent_id: parentId,
        curp: studentForm.values.curp.trim() || null,
        guardian_relationship: parentForm.values.relationship || null,
        phone: studentForm.values.phone.trim() || null,
        address: studentForm.values.address.trim() || null,
      });

      const studentId = created.id;
      const failures: string[] = [];

      if (consent) {
        try {
          await createConsent.mutateAsync({
            studentId,
            ...consent,
            guardian_relationship: consent.guardian_relationship || parentForm.values.relationship,
          });
        } catch {
          failures.push('consentimiento');
        }
      }

      for (const doc of pendingDocs) {
        try {
          await uploadDoc.mutateAsync({
            studentId,
            file: doc.file,
            doc_type: doc.doc_type,
            owner_type: doc.owner_type,
          });
        } catch {
          failures.push(doc.label);
        }
      }

      if (failures.length > 0) {
        notifications.show({
          color: 'yellow',
          title: 'Alumno creado con pendientes',
          message: `No se pudieron guardar: ${failures.join(', ')}. Puedes completarlos en el expediente del alumno.`,
          autoClose: 8000,
        });
      } else {
        notifications.show({
          color: 'green',
          message:
            parentMode === 'nuevo'
              ? 'Alumno creado. Se envió la invitación por correo al padre/tutor.'
              : 'Alumno creado.',
        });
      }

      handleClose();
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: e?.response?.data?.error || 'Error al registrar al alumno',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!studentForm.values.category_id) {
      notifications.show({ color: 'red', message: 'Selecciona una categoría.' });
      return;
    }
    try {
      const result = await createInvitation.mutateAsync({
        category_id: studentForm.values.category_id,
        expires_in_days: 7,
      });
      setLinkResult(result);
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: e?.response?.data?.error || 'No se pudo generar el link.',
      });
    }
  };

  const shareText = linkResult
    ? `Hola, te comparto el link para inscribir a tu hijo(a) en ${
        profile?.school?.name || 'la academia'
      } (categoría ${linkResult.category?.name || ''}): ${linkResult.url}`
    : '';

  return (
    /* Hoja a pantalla completa en teléfono: es un alta de varios pasos con
       teclado abierto, y un modal centrado deja el botón fuera de vista. */
    <BottomSheet opened={opened} onClose={handleClose} title="Nuevo alumno" size="full">
      <Stepper active={step} size="xs" mb="md">
        <Stepper.Step label="Alumno" description="Datos básicos">
          <Stack mt="md">
            <TextInput label="Nombre completo" required {...studentForm.getInputProps('full_name')} />
            <BirthDateInput
              required
              {...studentForm.getInputProps('birth_date')}
            />
            <TextInput label="Correo" type="email" required {...studentForm.getInputProps('email')} />
            <TextInput
              label="CURP"
              description="Opcional; también puedes subir el documento en el expediente."
              maxLength={18}
              {...studentForm.getInputProps('curp')}
            />
            <Select
              label="Categoría"
              required
              data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
              {...studentForm.getInputProps('category_id')}
            />
            <Group grow>
              <TextInput label="Teléfono del alumno" {...studentForm.getInputProps('phone')} />
              <TextInput label="Domicilio" {...studentForm.getInputProps('address')} />
            </Group>
            <Group justify="flex-end">
              <Button onClick={nextFromStudent}>Siguiente</Button>
            </Group>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Tutor" description="Contacto">
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
                <TextInput label="Celular" required {...parentForm.getInputProps('new_parent_phone')} />
                <Alert variant="light" icon={<IconMail size={16} />}>
                  Al finalizar se enviará una invitación por correo para que el
                  padre/tutor active su cuenta y cree su contraseña.
                </Alert>
              </>
            )}
            {parentMode !== 'ninguno' && (
              <Select
                label="Parentesco con el alumno"
                placeholder="Madre, padre, tutor legal…"
                data={RELATIONSHIP_OPTIONS}
                {...parentForm.getInputProps('relationship')}
              />
            )}
            <Group justify="space-between">
              <Button variant="default" onClick={() => setStep(0)}>
                Atrás
              </Button>
              <Button onClick={nextFromParent}>Siguiente</Button>
            </Group>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Permiso" description="Consentimiento">
          <Stack mt="md">
            {template ? (
              <ConsentCaptureForm
                template={template}
                defaultName={guardianName}
                defaultRelationship={parentForm.values.relationship}
                onSubmit={(payload) => {
                  setConsent(payload);
                  setStep(3);
                }}
                submitLabel="Guardar consentimiento"
              />
            ) : (
              <Alert color="yellow" variant="light">
                No hay una plantilla de consentimiento activa. Puedes registrar al
                alumno y capturarlo después.
              </Alert>
            )}
            <Group justify="space-between">
              <Button variant="default" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button
                variant="subtle"
                onClick={() => {
                  setConsent(null);
                  setStep(3);
                }}
              >
                Capturar después
              </Button>
            </Group>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Documentos" description="Opcional">
          <Stack mt="md">
            <Alert variant="light" color="blue" icon={<IconFileText size={16} />}>
              Puedes cargar los documentos ahora o después desde el expediente del
              alumno. La identificación del tutor es lo único que la academia
              necesita para aprobar una inscripción remota.
            </Alert>

            <Stack gap="xs">
              {DOC_CAPTURE_OPTIONS.map((option) => {
                const current = pendingDocs.find((d) => d.doc_type === option.doc_type);
                return (
                  <Card key={option.doc_type} withBorder radius="md" padding="sm">
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm" align="flex-start" wrap="nowrap">
                        <ThemeIcon
                          size={32}
                          radius="md"
                          variant="light"
                          color={current ? 'green' : 'gray'}
                        >
                          {current ? <IconCheck size={16} /> : <IconFileText size={16} />}
                        </ThemeIcon>
                        <div>
                          <Text size="sm" fw={600}>
                            {option.label}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {current ? current.file.name : option.hint || 'Opcional'}
                          </Text>
                        </div>
                      </Group>
                      <Group gap={4}>
                        <FileButton
                          accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                          onChange={(file) => file && setPendingFile(option, file)}
                        >
                          {(props) => (
                            <Button
                              {...props}
                              size="compact-xs"
                              variant={current ? 'default' : 'light'}
                              leftSection={<IconUpload size={13} />}
                            >
                              {current ? 'Cambiar' : 'Elegir'}
                            </Button>
                          )}
                        </FileButton>
                        {current && (
                          <Button
                            size="compact-xs"
                            variant="subtle"
                            color="red"
                            onClick={() => removePendingFile(option.doc_type)}
                          >
                            Quitar
                          </Button>
                        )}
                      </Group>
                    </Group>
                  </Card>
                );
              })}
            </Stack>

            <Group justify="space-between">
              <Button variant="default" onClick={() => setStep(2)}>
                Atrás
              </Button>
              <Button onClick={() => setStep(4)}>Siguiente</Button>
            </Group>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Resumen" description="Confirmar">
          <Stack mt="md">
            {linkResult ? (
              <Stack gap="md">
                <Alert color="green" variant="light" icon={<IconCheck size={16} />}>
                  Link creado para <b>{linkResult.category?.name}</b>. Vence el{' '}
                  {dayjs(linkResult.expires_at).format('DD/MM/YYYY [a las] HH:mm')}.
                </Alert>
                <Card withBorder radius="md" padding="sm">
                  <Text size="xs" c="dimmed" mb={4}>
                    Compártelo con el tutor
                  </Text>
                  <Text size="sm" style={{ wordBreak: 'break-all' }}>
                    {linkResult.url}
                  </Text>
                </Card>
                <Group grow>
                  <CopyButton value={linkResult.url}>
                    {({ copied, copy }) => (
                      <Button
                        variant={copied ? 'light' : 'default'}
                        color={copied ? 'green' : undefined}
                        leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        onClick={copy}
                      >
                        {copied ? 'Copiado' : 'Copiar'}
                      </Button>
                    )}
                  </CopyButton>
                  <Button
                    component="a"
                    href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noreferrer"
                    variant="light"
                    color="green"
                    leftSection={<IconBrandWhatsapp size={16} />}
                  >
                    WhatsApp
                  </Button>
                </Group>
                <Group justify="flex-end">
                  <Button onClick={handleClose}>Cerrar</Button>
                </Group>
              </Stack>
            ) : (
              <>
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
                        {parentForm.values.new_parent_email} ·{' '}
                        {parentForm.values.new_parent_phone}
                      </Text>
                      <Badge variant="light" color="blue" mt={6} leftSection={<IconMail size={12} />}>
                        Se invitará por correo
                      </Badge>
                    </>
                  )}
                </Card>

                <Card withBorder radius="md" padding="md">
                  <Group justify="space-between">
                    <Text size="sm" fw={600}>
                      Consentimiento
                    </Text>
                    <Badge color={consent ? 'green' : 'orange'} variant="light">
                      {consent ? 'Capturado' : 'Pendiente'}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>
                    {consent
                      ? `Firmado por ${consent.guardian_name}`
                      : 'Puedes capturarlo ahora o después en el expediente del alumno.'}
                  </Text>
                </Card>

                <Card withBorder radius="md" padding="md">
                  <Group justify="space-between">
                    <Text size="sm" fw={600}>
                      Documentos
                    </Text>
                    <Badge color={pendingDocs.length > 0 ? 'green' : 'gray'} variant="light">
                      {pendingDocs.length} para subir
                    </Badge>
                  </Group>
                  {pendingDocs.length === 0 && (
                    <Text size="xs" c="dimmed" mt={4}>
                      Sin documentos seleccionados. Se pueden completar después.
                    </Text>
                  )}
                </Card>

                <Alert variant="light" color="gray" icon={<IconShieldCheck size={16} />}>
                  El alumno se crea aunque el expediente quede incompleto. Un
                  expediente incompleto solo bloquea el paquete de liga, nunca los
                  entrenamientos ni los pagos.
                </Alert>

                <Group justify="space-between">
                  <Button variant="default" onClick={() => setStep(3)}>
                    Atrás
                  </Button>
                  <Group>
                    <Button
                      variant="light"
                      loading={createInvitation.isPending}
                      onClick={handleGenerateLink}
                    >
                      Generar link de inscripción
                    </Button>
                    <Button
                      onClick={onConfirm}
                      loading={submitting || create.isPending || inviteParent.isPending}
                    >
                      Registrar alumno
                    </Button>
                  </Group>
                </Group>
              </>
            )}
          </Stack>
        </Stepper.Step>
      </Stepper>
    </BottomSheet>
  );
}
