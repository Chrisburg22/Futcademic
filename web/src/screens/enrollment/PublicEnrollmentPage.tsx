'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Divider,
  FileButton,
  Group,
  Loader,
  Progress,
  Stack,
  Stepper,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconCamera,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconDownload,
  IconFileText,
  IconInfoCircle,
  IconLock,
  IconShieldCheck,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import {
  fetchPublicConsentPdf,
  usePublicEnrollment,
  useSaveEnrollmentDraft,
  useSubmitEnrollment,
  useUploadPublicEnrollmentDocument,
} from '../../hooks/useEnrollment';
import { saveBlob } from '../../lib/download';
import { ConsentCaptureForm, type ConsentPayload } from './ConsentCaptureForm';
import { EnrollmentStatusBadge } from './labels';

const STEP_LABELS = ['Alumno', 'Tutor', 'Permiso', 'Documentos', 'Enviar'];

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate() : null;
}

function formatDate(value?: string | null, withTime = false): string {
  if (!value) return '—';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return '—';
  return parsed.format(withTime ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY');
}

function apiMessage(error: unknown, fallback: string): string {
  const err = error as any;
  return err?.response?.data?.error || fallback;
}

// ---------------------------------------------------------------------------
// Estados terminales del link
// ---------------------------------------------------------------------------

function TerminalScreen({
  data,
  token,
  onRefresh,
}: {
  data: any;
  token: string;
  onRefresh: () => Promise<unknown>;
}) {
  const status = data.invitation.status as string;
  const application = data.application;
  const [downloading, setDownloading] = useState(false);

  const view =
    status === 'aprobada'
      ? {
          icon: <IconCircleCheck size={40} />,
          color: 'green',
          title: 'Inscripción aprobada',
          text: 'La academia revisó la solicitud y dio de alta al alumno. Te contactarán con los siguientes pasos.',
        }
      : status === 'rechazada'
        ? {
            icon: <IconX size={40} />,
            color: 'red',
            title: 'Solicitud rechazada',
            text:
              application?.rejection_reason ||
              'La academia rechazó la solicitud. Puede reabrir este link para que corrijas la información.',
          }
        : status === 'enviada'
          ? {
              icon: <IconClock size={40} />,
              color: 'blue',
              title: 'Solicitud recibida',
              text: 'La academia revisará la información y la identificación del tutor. No necesitas hacer nada más por ahora.',
            }
          : status === 'expirada'
            ? {
                icon: <IconClock size={40} />,
                color: 'gray',
                title: 'Este link expiró',
                text: 'Pide a la academia que genere un link nuevo para continuar con la inscripción.',
              }
            : {
                icon: <IconX size={40} />,
                color: 'gray',
                title: 'Este link ya no está disponible',
                text: 'Pide a la academia que genere un link nuevo para continuar con la inscripción.',
              };

  const downloadConsent = async () => {
    setDownloading(true);
    try {
      const blob = await fetchPublicConsentPdf(token);
      saveBlob(blob, 'consentimiento.pdf');
    } catch (err) {
      notifications.show({
        color: 'red',
        message: apiMessage(err, 'No se pudo descargar el consentimiento.'),
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card withBorder radius="lg" padding="xl">
      <Stack align="center" gap="sm">
        <ThemeIcon size={72} radius="xl" variant="light" color={view.color}>
          {view.icon}
        </ThemeIcon>
        <Title order={2} ta="center" size="h3">
          {view.title}
        </Title>
        <Text ta="center" c="dimmed" size="sm">
          {view.text}
        </Text>

        <Card withBorder radius="md" padding="md" w="100%" mt="sm">
          <Stack gap={6}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Academia
              </Text>
              <Text size="sm" fw={600}>
                {data.academy.name}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Categoría
              </Text>
              <Badge variant="light">{data.category.name}</Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Estado
              </Text>
              <EnrollmentStatusBadge status={status} />
            </Group>
            {application?.submitted_at && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Enviada
                </Text>
                <Text size="sm">{formatDate(application.submitted_at, true)}</Text>
              </Group>
            )}
          </Stack>
        </Card>

        {data.invitation.can_download_consent && (
          <Button
            variant="light"
            leftSection={<IconDownload size={16} />}
            onClick={downloadConsent}
            loading={downloading}
            fullWidth
          >
            Descargar consentimiento (PDF)
          </Button>
        )}

        <Anchor component="button" type="button" size="sm" onClick={() => onRefresh()}>
          Actualizar estado
        </Anchor>
      </Stack>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Fila de documento
// ---------------------------------------------------------------------------

function DocumentRow({
  item,
  document,
  uploading,
  onUpload,
}: {
  item: {
    type: string;
    label: string;
    owner_type: 'alumno' | 'tutor';
    required: boolean;
  };
  document?: any;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <Card withBorder radius="md" padding="sm">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap="sm" align="flex-start" wrap="nowrap">
          <ThemeIcon
            size={34}
            radius="md"
            variant="light"
            color={document ? 'green' : 'gray'}
          >
            {document ? <IconCheck size={18} /> : <IconFileText size={18} />}
          </ThemeIcon>
          <div>
            <Text size="sm" fw={600}>
              {item.label}
            </Text>
            <Text size="xs" c="dimmed">
              {item.owner_type === 'tutor'
                ? 'Identificación del tutor'
                : 'Documento del alumno'}
              {item.required ? ' · Requerido para liga' : ' · Opcional'}
            </Text>
            {document && (
              <Group gap="xs" mt={4}>
                <EnrollmentStatusBadge status={document.status} size="xs" />
                {document.signed_url && (
                  <Anchor href={document.signed_url} target="_blank" rel="noreferrer" size="xs">
                    Ver archivo
                  </Anchor>
                )}
              </Group>
            )}
          </div>
        </Group>

        <FileButton
          accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={(file) => file && onUpload(file)}
        >
          {(props) => (
            <Button
              {...props}
              size="xs"
              variant={document ? 'default' : 'light'}
              leftSection={<IconUpload size={14} />}
              loading={uploading}
            >
              {document ? 'Reemplazar' : 'Subir'}
            </Button>
          )}
        </FileButton>
      </Group>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Página pública
// ---------------------------------------------------------------------------

export function PublicEnrollmentPage({ token }: { token: string }) {
  const { data, isLoading, error, refetch } = usePublicEnrollment(token);
  const saveDraft = useSaveEnrollmentDraft(token);
  const uploadDoc = useUploadPublicEnrollmentDocument(token);
  const submit = useSubmitEnrollment(token);

  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState<ConsentPayload | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      student_full_name: '',
      student_birth_date: null as Date | null,
      student_curp: '',
      student_phone: '',
      student_address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      medical_notes: '',
      guardian_full_name: '',
      guardian_relationship: '',
      guardian_email: '',
      guardian_phone: '',
      guardian_address: '',
    },
    validate: {
      student_full_name: (v) => (v.trim() ? null : 'Escribe el nombre del alumno'),
      student_birth_date: (v) => (v ? null : 'Selecciona la fecha de nacimiento'),
      guardian_full_name: (v) => (v.trim() ? null : 'Escribe el nombre del tutor'),
      guardian_relationship: (v) => (v ? null : 'Selecciona el parentesco'),
      guardian_email: (v) =>
        /^\S+@\S+\.\S+$/.test(v.trim()) ? null : 'Correo inválido',
      guardian_phone: (v) => (v.trim() ? null : 'El celular es obligatorio'),
    },
  });

  useEffect(() => {
    if (!data?.form || initialized) return;
    const fields = data.form.fields || {};
    form.setValues({
      student_full_name: fields.student_full_name || '',
      student_birth_date: parseDate(fields.student_birth_date),
      student_curp: fields.student_curp || '',
      student_phone: fields.student_phone || '',
      student_address: fields.student_address || '',
      emergency_contact_name: fields.emergency_contact_name || '',
      emergency_contact_phone: fields.emergency_contact_phone || '',
      medical_notes: fields.medical_notes || '',
      guardian_full_name: fields.guardian_full_name || '',
      guardian_relationship: fields.guardian_relationship || '',
      guardian_email: fields.guardian_email || '',
      guardian_phone: fields.guardian_phone || '',
      guardian_address: fields.guardian_address || '',
    });
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const checklist = useMemo(() => {
    const catalog = (data?.checklist || []) as Array<{
      type: string;
      label: string;
      owner_type: 'alumno' | 'tutor';
      required: boolean;
    }>;
    return catalog.filter((item) => item.type !== 'otro');
  }, [data]);

  const documentsByType = useMemo(() => {
    const map = new Map<string, any>();
    for (const doc of data?.documents || []) {
      map.set(`${doc.owner_type}:${doc.doc_type}`, doc);
    }
    return map;
  }, [data]);

  const requiredDocuments = checklist.filter((item) => item.required);
  const uploadedRequired = requiredDocuments.filter((item) =>
    documentsByType.has(`${item.owner_type}:${item.type}`),
  ).length;

  const tutorDocsReady =
    Boolean(documentsByType.get('tutor:identificacion_tutor_frente')) &&
    Boolean(documentsByType.get('tutor:identificacion_tutor_reverso'));

  if (isLoading) {
    return (
      <Center mih="70vh">
        <Stack align="center" gap="xs">
          <Loader />
          <Text size="sm" c="dimmed">
            Abriendo el formulario de inscripción…
          </Text>
        </Stack>
      </Center>
    );
  }

  if (error || !data) {
    const status = (error as any)?.response?.status;
    return (
      <Container size={520} py="xl">
        <Card withBorder radius="lg" padding="xl">
          <Stack align="center" gap="sm">
            <ThemeIcon size={64} radius="xl" variant="light" color="gray">
              <IconLock size={32} />
            </ThemeIcon>
            <Title order={2} size="h3" ta="center">
              {status === 410 ? 'Este link ya no está disponible' : 'Link no válido'}
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              {apiMessage(
                error,
                'Revisa que hayas abierto el link completo o pide uno nuevo a la academia.',
              )}
            </Text>
          </Stack>
        </Card>
      </Container>
    );
  }

  const editable = Boolean(data.invitation.editable);
  const template = data.consent_template;

  const serializeFields = () => ({
    ...form.values,
    student_birth_date: form.values.student_birth_date
      ? dayjs(form.values.student_birth_date).format('YYYY-MM-DD')
      : null,
  });

  const persistDraft = async () => {
    try {
      await saveDraft.mutateAsync(serializeFields());
    } catch (err) {
      notifications.show({
        color: 'yellow',
        title: 'No pudimos guardar el avance',
        message: 'Puedes continuar; al enviar se guardará todo de nuevo.',
      });
    }
  };

  /**
   * `validateField` no devuelve un mapa de errores: devuelve `{ hasError, error }`
   * y además pinta el mensaje bajo el campo. Por eso se consulta `hasError` uno
   * por uno; esparcir el resultado hacía que el paso nunca avanzara.
   */
  const stepIsValid = (paths: string[]) =>
    paths.every((path) => !form.validateField(path).hasError);

  const nextFromStudent = async () => {
    if (!stepIsValid(['student_full_name', 'student_birth_date'])) return;
    await persistDraft();
    setStep(1);
  };

  const nextFromTutor = async () => {
    const guardianFields = [
      'guardian_full_name',
      'guardian_relationship',
      'guardian_email',
      'guardian_phone',
    ];
    if (!stepIsValid(guardianFields)) return;
    await persistDraft();
    setStep(2);
  };

  const handleConsent = async (payload: ConsentPayload) => {
    setConsent(payload);
    setStep(3);
  };

  const handleUpload = async (file: File, item: any) => {
    setDocumentError(null);
    setUploadingType(`${item.owner_type}:${item.type}`);
    try {
      await uploadDoc.mutateAsync({
        file,
        doc_type: item.type,
        owner_type: item.owner_type,
      });
      await refetch();
      notifications.show({ color: 'green', message: 'Documento cargado.' });
    } catch (err) {
      notifications.show({
        color: 'red',
        message: apiMessage(err, 'No se pudo subir el documento.'),
      });
    } finally {
      setUploadingType(null);
    }
  };

  const goToReview = () => {
    if (!tutorDocsReady) {
      setDocumentError(
        'Para enviar la solicitud necesitas subir la identificación del tutor por ambos lados. Los demás documentos pueden completarse después.',
      );
      return;
    }
    setDocumentError(null);
    setStep(4);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!consent) {
      setStep(2);
      return;
    }
    try {
      await submit.mutateAsync({ fields: serializeFields(), consent });
      await refetch();
      notifications.show({ color: 'green', message: 'Solicitud enviada.' });
    } catch (err) {
      setSubmitError(apiMessage(err, 'No se pudo enviar la solicitud.'));
    }
  };

  const downloadConsent = async () => {
    try {
      const blob = await fetchPublicConsentPdf(token);
      saveBlob(blob, 'consentimiento.pdf');
    } catch (err) {
      notifications.show({
        color: 'red',
        message: apiMessage(err, 'No se pudo descargar el consentimiento.'),
      });
    }
  };

  return (
    <Box mih="100vh" bg="var(--mantine-color-gray-0)">
      <Box bg="futcamedic.8" c="white" py="lg" px="md">
        <Container size={620} px={0}>
          <Group gap="sm" wrap="nowrap">
            <Avatar
              src={data.academy.logo_url || undefined}
              radius="md"
              size={44}
              color="white"
            >
              {data.academy.name?.[0]?.toUpperCase()}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <Text size="xs" tt="uppercase" fw={700} opacity={0.75}>
                Inscripción
              </Text>
              <Text fw={700} size="lg" truncate>
                {data.academy.name}
              </Text>
            </div>
          </Group>
          <Group gap="xs" mt="md">
            <Badge color="white" variant="outline" size="sm">
              {data.category.name}
            </Badge>
            {data.category.birth_years?.length > 0 && (
              <Badge color="white" variant="outline" size="sm">
                Nacimiento {data.category.birth_years.join(' · ')}
              </Badge>
            )}
            {editable && (
              <Badge color="white" variant="filled" size="sm" c="futcamedic.9">
                Vence {formatDate(data.invitation.expires_at)}
              </Badge>
            )}
          </Group>
        </Container>
      </Box>

      <Container size={620} py="lg" pb={48}>
        {!editable || data.terminal ? (
          <TerminalScreen data={data} token={token} onRefresh={refetch} />
        ) : (
          <Stack gap="md">
            {data.form?.rejection_reason && (
              <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
                <Text size="sm" fw={600}>
                  La academia pidió corregir la solicitud
                </Text>
                <Text size="sm">{data.form.rejection_reason}</Text>
              </Alert>
            )}

            <Card withBorder radius="lg" padding="md">
              <Stepper
                active={step}
                size="xs"
                onStepClick={(next) => {
                  if (next < step) setStep(next);
                }}
              >
                {STEP_LABELS.map((label) => (
                  <Stepper.Step key={label} label={label} />
                ))}
              </Stepper>
            </Card>

            <Card withBorder radius="lg" padding="lg">
              {step === 0 && (
                <Stack gap="md">
                  <div>
                    <Title order={2} size="h4">
                      Datos del alumno
                    </Title>
                    <Text size="sm" c="dimmed">
                      Tal como aparecen en el acta de nacimiento.
                    </Text>
                  </div>

                  <TextInput
                    label="Nombre completo"
                    placeholder="Nombre y apellidos"
                    required
                    {...form.getInputProps('student_full_name')}
                  />
                  <DateInput
                    label="Fecha de nacimiento"
                    placeholder="DD/MM/AAAA"
                    required
                    maxDate={new Date()}
                    valueFormat="DD/MM/YYYY"
                    {...form.getInputProps('student_birth_date')}
                  />
                  <TextInput
                    label="CURP"
                    description="Si la tienes a mano. También puedes subir el documento después."
                    placeholder="18 caracteres"
                    maxLength={18}
                    {...form.getInputProps('student_curp')}
                  />
                  <TextInput
                    label="Teléfono del alumno"
                    placeholder="Opcional"
                    {...form.getInputProps('student_phone')}
                  />
                  <Textarea
                    label="Domicilio"
                    placeholder="Calle, número, colonia, municipio"
                    autosize
                    minRows={2}
                    {...form.getInputProps('student_address')}
                  />

                  <Divider label="En caso de emergencia" labelPosition="left" />
                  <TextInput
                    label="Nombre del contacto"
                    {...form.getInputProps('emergency_contact_name')}
                  />
                  <TextInput
                    label="Teléfono del contacto"
                    {...form.getInputProps('emergency_contact_phone')}
                  />
                  <Textarea
                    label="Notas médicas"
                    description="Alergias, condiciones o medicamentos que la academia deba saber."
                    autosize
                    minRows={2}
                    {...form.getInputProps('medical_notes')}
                  />

                  <Group justify="flex-end">
                    <Button onClick={nextFromStudent} loading={saveDraft.isPending}>
                      Continuar
                    </Button>
                  </Group>
                </Stack>
              )}

              {step === 1 && (
                <Stack gap="md">
                  <div>
                    <Title order={2} size="h4">
                      Datos del tutor
                    </Title>
                    <Text size="sm" c="dimmed">
                      El correo y el celular son obligatorios: por ahí se dará
                      seguimiento a la inscripción.
                    </Text>
                  </div>

                  <TextInput
                    label="Nombre completo"
                    required
                    {...form.getInputProps('guardian_full_name')}
                  />
                  <TextInput
                    label="Parentesco con el alumno"
                    placeholder="Madre, padre, tutor legal…"
                    required
                    {...form.getInputProps('guardian_relationship')}
                  />
                  <TextInput
                    label="Correo electrónico"
                    type="email"
                    required
                    {...form.getInputProps('guardian_email')}
                  />
                  <TextInput
                    label="Celular"
                    type="tel"
                    required
                    {...form.getInputProps('guardian_phone')}
                  />
                  <Textarea
                    label="Domicilio del tutor"
                    description="Opcional si es el mismo del alumno."
                    autosize
                    minRows={2}
                    {...form.getInputProps('guardian_address')}
                  />

                  <Group justify="space-between">
                    <Button variant="default" onClick={() => setStep(0)}>
                      Atrás
                    </Button>
                    <Button onClick={nextFromTutor} loading={saveDraft.isPending}>
                      Continuar
                    </Button>
                  </Group>
                </Stack>
              )}

              {step === 2 && (
                <Stack gap="md">
                  <div>
                    <Title order={2} size="h4">
                      Consentimiento informado
                    </Title>
                    <Text size="sm" c="dimmed">
                      Lee el texto y acepta las autorizaciones. La persona tutora
                      debe escribir su nombre como firma.
                    </Text>
                  </div>
                  <ConsentCaptureForm
                    template={template}
                    defaultName={form.values.guardian_full_name}
                    defaultRelationship={form.values.guardian_relationship}
                    onSubmit={handleConsent}
                    submitLabel="Continuar a documentos"
                  />
                  <Group>
                    <Button variant="default" onClick={() => setStep(1)}>
                      Atrás
                    </Button>
                  </Group>
                </Stack>
              )}

              {step === 3 && (
                <Stack gap="md">
                  <div>
                    <Title order={2} size="h4">
                      Documentos
                    </Title>
                    <Text size="sm" c="dimmed">
                      Para enviar solo necesitas la identificación del tutor.
                      Los demás documentos pueden completarse en la academia.
                    </Text>
                  </div>

                  <Card withBorder radius="md" padding="sm">
                    <Group justify="space-between" mb={6}>
                      <Text size="sm" fw={600}>
                        Checklist de liga
                      </Text>
                      <Text size="xs" c="dimmed">
                        {uploadedRequired} de {requiredDocuments.length}
                      </Text>
                    </Group>
                    <Progress
                      value={(uploadedRequired / Math.max(requiredDocuments.length, 1)) * 100}
                      size="sm"
                      radius="xl"
                    />
                  </Card>

                  <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />}>
                    Puedes tomar una foto con el celular. Aceptamos PDF, JPG, PNG,
                    WEBP o HEIC de hasta 10 MB.
                  </Alert>

                  {checklist.map((item) => (
                    <DocumentRow
                      key={`${item.owner_type}:${item.type}`}
                      item={item}
                      document={documentsByType.get(`${item.owner_type}:${item.type}`)}
                      uploading={uploadingType === `${item.owner_type}:${item.type}`}
                      onUpload={(file) => handleUpload(file, item)}
                    />
                  ))}

                  {documentError && (
                    <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
                      {documentError}
                    </Alert>
                  )}

                  <Group justify="space-between">
                    <Button variant="default" onClick={() => setStep(2)}>
                      Atrás
                    </Button>
                    <Button onClick={goToReview}>Revisar solicitud</Button>
                  </Group>
                </Stack>
              )}

              {step === 4 && (
                <Stack gap="md">
                  <div>
                    <Title order={2} size="h4">
                      Revisa y envía
                    </Title>
                    <Text size="sm" c="dimmed">
                      Después de enviar, la academia revisará la solicitud antes de
                      dar de alta al alumno.
                    </Text>
                  </div>

                  {data.form?.category_mismatch && (
                    <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />}>
                      La fecha de nacimiento no coincide con los años de la
                      categoría ({data.category.birth_years.join(' · ')}). La
                      academia revisará el caso; puedes enviar la solicitud.
                    </Alert>
                  )}

                  <Card withBorder radius="md" padding="md">
                    <Group justify="space-between" mb="xs">
                      <Text fw={600} size="sm">
                        Alumno
                      </Text>
                      <Anchor component="button" type="button" size="xs" onClick={() => setStep(0)}>
                        Editar
                      </Anchor>
                    </Group>
                    <Stack gap={4}>
                      <Text size="sm">{form.values.student_full_name}</Text>
                      <Text size="xs" c="dimmed">
                        Nacimiento: {formatDate(serializeFields().student_birth_date)} ·{' '}
                        {data.category.name}
                      </Text>
                      {form.values.student_curp && (
                        <Text size="xs" c="dimmed">
                          CURP: {form.values.student_curp}
                        </Text>
                      )}
                    </Stack>
                  </Card>

                  <Card withBorder radius="md" padding="md">
                    <Group justify="space-between" mb="xs">
                      <Text fw={600} size="sm">
                        Tutor
                      </Text>
                      <Anchor component="button" type="button" size="xs" onClick={() => setStep(1)}>
                        Editar
                      </Anchor>
                    </Group>
                    <Stack gap={4}>
                      <Text size="sm">{form.values.guardian_full_name}</Text>
                      <Text size="xs" c="dimmed">
                        {form.values.guardian_email} · {form.values.guardian_phone}
                      </Text>
                    </Stack>
                  </Card>

                  <Card withBorder radius="md" padding="md">
                    <Group justify="space-between" mb="xs">
                      <Text fw={600} size="sm">
                        Consentimiento
                      </Text>
                      <Anchor component="button" type="button" size="xs" onClick={() => setStep(2)}>
                        Revisar
                      </Anchor>
                    </Group>
                    <Group gap="xs">
                      <ThemeIcon size={28} radius="xl" variant="light" color="green">
                        <IconShieldCheck size={16} />
                      </ThemeIcon>
                      <div>
                        <Text size="sm">
                          Firmado por {consent?.guardian_name || '—'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Versión {template.version}
                        </Text>
                      </div>
                    </Group>
                  </Card>

                  <Card withBorder radius="md" padding="md">
                    <Group justify="space-between" mb="xs">
                      <Text fw={600} size="sm">
                        Documentos
                      </Text>
                      <Anchor component="button" type="button" size="xs" onClick={() => setStep(3)}>
                        Editar
                      </Anchor>
                    </Group>
                    <Group gap="xs">
                      <Badge variant="light" color={tutorDocsReady ? 'green' : 'red'}>
                        Identificación del tutor {tutorDocsReady ? 'completa' : 'pendiente'}
                      </Badge>
                      <Badge variant="light" color="gray">
                        {uploadedRequired} de {requiredDocuments.length} del checklist
                      </Badge>
                    </Group>
                  </Card>

                  {submitError && (
                    <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
                      {submitError}
                    </Alert>
                  )}

                  <Alert variant="light" color="gray" icon={<IconLock size={16} />}>
                    Tus datos y documentos se usan solo para la inscripción y se
                    guardan en un espacio privado de la academia.
                  </Alert>

                  <Group justify="space-between">
                    <Button variant="default" onClick={() => setStep(3)}>
                      Atrás
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      loading={submit.isPending}
                      leftSection={<IconCheck size={16} />}
                    >
                      Enviar solicitud
                    </Button>
                  </Group>
                </Stack>
              )}
            </Card>

            <Group justify="center" gap="xs">
              <IconShieldCheck size={14} />
              <Text size="xs" c="dimmed" ta="center">
                Formulario seguro de Futcademic. No compartas este link.
              </Text>
            </Group>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
