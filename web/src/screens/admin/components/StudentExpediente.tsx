'use client';

import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  FileButton,
  Group,
  Modal,
  Progress,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconCheck,
  IconDownload,
  IconFileText,
  IconLink,
  IconRefresh,
  IconShieldCheck,
  IconTrash,
  IconUpload,
  IconUserPlus,
  IconX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useAuth } from '../../../contexts/AuthContext';
import {
  downloadConsentPdf,
  downloadExpedientePackage,
  useCreateStudentConsent,
  useDeleteStudentDocument,
  useGetStudentExpediente,
  useReuseTutorDocuments,
  useTutorDocumentAvailability,
  useUpdateStudentDocument,
  useUploadStudentDocument,
} from '../../../hooks/useExpediente';
import { ConsentCaptureForm } from '../../enrollment/ConsentCaptureForm';
import { EnrollmentStatusBadge, relationshipLabel } from '../../enrollment/labels';

type Props = {
  studentId: string;
  student: any;
};

export function StudentExpediente({ studentId, student }: Props) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  const { data, isLoading } = useGetStudentExpediente(studentId);
  const upload = useUploadStudentDocument();
  const updateDoc = useUpdateStudentDocument();
  const deleteDoc = useDeleteStudentDocument();
  const createConsent = useCreateStudentConsent();
  const reuseTutor = useReuseTutorDocuments();
  const availability = useTutorDocumentAvailability(studentId, !!data);

  const [consentOpen, setConsentOpen] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [rejectDoc, setRejectDoc] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (isLoading) return null;
  if (!data) return null;

  const checklist = (data.checklist || []) as Array<{
    type: string;
    label: string;
    owner_type: 'alumno' | 'tutor';
    required: boolean;
  }>;
  const docsByKey = new Map<string, any>(
    (data.documents || []).map((doc: any) => [
      `${doc.owner_type}:${doc.doc_type}`,
      doc,
    ]),
  );
  const required = checklist.filter((item) => item.required);
  const validated = required.filter(
    (item) => docsByKey.get(`${item.owner_type}:${item.type}`)?.status === 'validado',
  ).length;
  const missing = required.filter((item) => !docsByKey.has(`${item.owner_type}:${item.type}`));
  const status = data.status as string;

  const handleUpload = async (item: any, file: File) => {
    const key = `${item.owner_type}:${item.type}`;
    setUploadingKey(key);
    try {
      await upload.mutateAsync({
        studentId,
        file,
        doc_type: item.type,
        owner_type: item.owner_type,
      });
      notifications.show({ color: 'green', message: `${item.label}: documento cargado.` });
    } catch (err: any) {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.error || 'No se pudo subir el documento.',
      });
    } finally {
      setUploadingKey(null);
    }
  };

  const handleValidate = async (doc: any) => {
    try {
      await updateDoc.mutateAsync({
        studentId,
        documentId: doc.id,
        status: 'validado',
      });
      notifications.show({ color: 'green', message: 'Documento validado.' });
    } catch (err: any) {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.error || 'No se pudo validar el documento.',
      });
    }
  };

  const handleReject = async () => {
    if (!rejectDoc || !rejectReason.trim()) return;
    try {
      await updateDoc.mutateAsync({
        studentId,
        documentId: rejectDoc.id,
        status: 'rechazado',
        rejection_reason: rejectReason.trim(),
      });
      notifications.show({ color: 'green', message: 'Documento rechazado.' });
      setRejectDoc(null);
      setRejectReason('');
    } catch (err: any) {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.error || 'No se pudo rechazar el documento.',
      });
    }
  };

  const handleDelete = (doc: any) => {
    modals.openConfirmModal({
      title: 'Eliminar documento',
      children: (
        <Text size="sm">
          ¿Eliminar <b>{doc.label}</b>? El archivo se borra del almacenamiento y no
          se puede recuperar.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteDoc.mutateAsync({ studentId, documentId: doc.id });
          notifications.show({ color: 'green', message: 'Documento eliminado.' });
        } catch (err: any) {
          notifications.show({
            color: 'red',
            message: err?.response?.data?.error || 'No se pudo eliminar el documento.',
          });
        }
      },
    });
  };

  const handleConsent = async (payload: any) => {
    try {
      await createConsent.mutateAsync({
        studentId,
        ...payload,
        guardian_phone: student?.parent?.phone || null,
      });
      notifications.show({ color: 'green', message: 'Consentimiento registrado.' });
      setConsentOpen(false);
    } catch (err: any) {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.error || 'No se pudo registrar el consentimiento.',
      });
    }
  };

  const handlePackage = async () => {
    setDownloading(true);
    try {
      await downloadExpedientePackage(
        studentId,
        `paquete-liga-${(student?.full_name || 'alumno').replace(/\s+/g, '-').toLowerCase()}.zip`,
      );
    } catch {
      notifications.show({
        color: 'red',
        message: 'El expediente está incompleto. Valida todos los documentos requeridos.',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleConsentPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadConsentPdf(
        studentId,
        `consentimiento-${(student?.full_name || 'alumno').replace(/\s+/g, '-').toLowerCase()}.pdf`,
      );
    } catch {
      notifications.show({ color: 'red', message: 'No se pudo descargar el consentimiento.' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleReuse = async () => {
    try {
      const result = await reuseTutor.mutateAsync(studentId);
      notifications.show({
        color: 'green',
        message: `Se reutilizaron ${result.copied} documentos del tutor.`,
      });
    } catch (err: any) {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.error || 'No se pudo reutilizar la identificación.',
      });
    }
  };

  return (
    <Card withBorder radius="md" padding="lg" mb="md">
      <Group justify="space-between" align="flex-start" mb="sm" wrap="wrap">
        <Group gap="xs">
          <ThemeIcon variant="light" radius="md" color="green">
            <IconShieldCheck size={18} />
          </ThemeIcon>
          <div>
            <Title order={3} size="h5">
              Expediente de inscripción
            </Title>
            <Text size="xs" c="dimmed">
              {status === 'completo'
                ? 'Listo para el paquete de liga.'
                : 'Un expediente incompleto no bloquea entrenamientos ni pagos.'}
            </Text>
          </div>
        </Group>
        <Group gap="xs">
          <EnrollmentStatusBadge status={status} size="md" />
          {isAdmin && (
            <Tooltip
              label={
                status === 'completo'
                  ? 'Descargar ZIP con carátula, consentimiento y documentos validados'
                  : 'Se habilita cuando los 7 documentos estén validados y el consentimiento firmado'
              }
            >
              <Button
                variant="light"
                size="xs"
                leftSection={<IconDownload size={14} />}
                disabled={status !== 'completo'}
                loading={downloading}
                onClick={handlePackage}
              >
                Paquete de liga
              </Button>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Card withBorder radius="md" padding="sm" mb="md">
        <Group justify="space-between" mb={6}>
          <Text size="sm" fw={600}>
            Documentos validados
          </Text>
          <Text size="xs" c="dimmed">
            {data.validated_documents} de {required.length}
          </Text>
        </Group>
        <Progress
          value={(data.validated_documents / Math.max(required.length, 1)) * 100}
          color={status === 'completo' ? 'green' : status === 'en_revision' ? 'yellow' : 'orange'}
          radius="xl"
          size="sm"
        />
        {missing.length > 0 && (
          <Text size="xs" c="dimmed" mt={6}>
            Faltan: {missing.map((item) => item.label).join(', ')}
          </Text>
        )}
      </Card>

      {status === 'sin_tutor' && (
        <Alert color="gray" variant="light" icon={<IconUserPlus size={16} />} mb="md">
          Este alumno no tiene tutor asignado. Los alumnos históricos se conservan
          así y no se bloquean; el expediente se puede completar cuando se vincule
          un tutor.
        </Alert>
      )}

      {/* Consentimiento */}
      <Card withBorder radius="md" padding="md" mb="md">
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <IconShieldCheck size={18} />
            <Text fw={600} size="sm">
              Consentimiento informado
            </Text>
          </Group>
          <Group gap="xs">
            {data.consent && (
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconDownload size={14} />}
                loading={downloadingPdf}
                onClick={handleConsentPdf}
              >
                PDF
              </Button>
            )}
            {data.consent_template && status !== 'sin_tutor' && (
              <Button
                variant="light"
                size="xs"
                leftSection={<IconShieldCheck size={14} />}
                onClick={() => setConsentOpen(true)}
              >
                {data.consent ? 'Actualizar' : 'Captar consentimiento'}
              </Button>
            )}
          </Group>
        </Group>

        {data.consent ? (
          <Stack gap={4}>
            <Text size="sm">
              Firmado por <b>{data.consent.guardian_name}</b>
              {data.consent.guardian_relationship
                ? ` (${relationshipLabel(data.consent.guardian_relationship)})`
                : ''}
            </Text>
            <Text size="xs" c="dimmed">
              Versión {data.consent.consent_version} ·{' '}
              {dayjs(data.consent.accepted_at).format('DD/MM/YYYY HH:mm')}
            </Text>
            <Group gap="xs" mt={4}>
              <Badge variant="light" color={data.consent.accepted_image ? 'green' : 'gray'} size="xs">
                Imagen {data.consent.accepted_image ? 'autorizada' : 'no autorizada'}
              </Badge>
              <Badge variant="light" color="gray" size="xs">
                IP {data.consent.ip || '—'}
              </Badge>
            </Group>
            {data.consent.has_pdf && (
              <Text size="xs" c="dimmed">
                Constancia PDF archivada con versión, hash del texto y evidencia.
              </Text>
            )}
          </Stack>
        ) : (
          <Alert color="yellow" variant="light" icon={<IconAlertTriangle size={16} />}>
            Sin consentimiento. Es obligatorio para el paquete de liga, pero no
            bloquea entrenamientos, pagos ni la inscripción.
          </Alert>
        )}
      </Card>

      {/* Documentos */}
      <Group justify="space-between" mb="sm">
        <Text fw={600} size="sm">
          Documentos
        </Text>
        {availability.data?.available && (
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconLink size={14} />}
            loading={reuseTutor.isPending}
            onClick={handleReuse}
          >
            Reutilizar identificación del tutor
          </Button>
        )}
      </Group>

      <Stack gap="xs">
        {checklist.map((item) => {
          const key = `${item.owner_type}:${item.type}`;
          const doc = docsByKey.get(key);
          return (
            <Card key={key} withBorder radius="md" padding="sm">
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <Group gap="sm" align="flex-start" wrap="nowrap">
                  <ThemeIcon
                    size={34}
                    radius="md"
                    variant="light"
                    color={doc ? (doc.status === 'validado' ? 'green' : 'yellow') : 'gray'}
                  >
                    <IconFileText size={18} />
                  </ThemeIcon>
                  <div>
                    <Group gap={6}>
                      <Text size="sm" fw={600}>
                        {item.label}
                      </Text>
                      {item.required && (
                        <Badge size="xs" variant="light" color="gray">
                          Requerido
                        </Badge>
                      )}
                    </Group>
                    <Group gap="xs" mt={2}>
                      {doc ? (
                        <>
                          <EnrollmentStatusBadge status={doc.status} size="xs" />
                          <Text size="xs" c="dimmed">
                            {dayjs(doc.uploaded_at).format('DD/MM/YYYY')}
                          </Text>
                          {doc.reused_from && (
                            <Badge size="xs" variant="light" color="violet">
                              Reutilizado
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Text size="xs" c="dimmed">
                          Sin cargar
                        </Text>
                      )}
                    </Group>
                    {doc?.rejection_reason && (
                      <Text size="xs" c="red" mt={2}>
                        {doc.rejection_reason}
                      </Text>
                    )}
                  </div>
                </Group>

                <Group gap={4}>
                  {doc?.signed_url && (
                    <Button
                      component="a"
                      href={doc.signed_url}
                      target="_blank"
                      rel="noreferrer"
                      size="compact-xs"
                      variant="subtle"
                    >
                      Ver
                    </Button>
                  )}
                  <FileButton
                    accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                    onChange={(file) => file && handleUpload(item, file)}
                  >
                    {(props) => (
                      <Button
                        {...props}
                        size="compact-xs"
                        variant={doc ? 'default' : 'light'}
                        leftSection={<IconUpload size={13} />}
                        loading={uploadingKey === key}
                      >
                        {doc ? 'Reemplazar' : 'Subir'}
                      </Button>
                    )}
                  </FileButton>
                  {doc && doc.status !== 'validado' && (
                    <Button
                      size="compact-xs"
                      variant="light"
                      color="green"
                      leftSection={<IconCheck size={13} />}
                      onClick={() => handleValidate(doc)}
                    >
                      Validar
                    </Button>
                  )}
                  {doc && doc.status !== 'rechazado' && (
                    <Button
                      size="compact-xs"
                      variant="light"
                      color="red"
                      leftSection={<IconX size={13} />}
                      onClick={() => {
                        setRejectDoc(doc);
                        setRejectReason('');
                      }}
                    >
                      Rechazar
                    </Button>
                  )}
                  {doc && (
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="red"
                      aria-label="Eliminar documento"
                      onClick={() => handleDelete(doc)}
                    >
                      <IconTrash size={14} />
                    </Button>
                  )}
                </Group>
              </Group>
            </Card>
          );
        })}
      </Stack>

      <Divider my="md" />
      <Group justify="space-between" wrap="wrap">
        <Text size="xs" c="dimmed" maw={420}>
          Los documentos se guardan en un bucket privado. Los enlaces de vista
          vencen en 5 minutos y cada descarga queda en la bitácora.
        </Text>
        <Button
          variant="subtle"
          size="xs"
          leftSection={<IconRefresh size={14} />}
          onClick={() => window.location.reload()}
        >
          Actualizar
        </Button>
      </Group>

      {/* Modal consentimiento */}
      <Modal
        opened={consentOpen}
        onClose={() => setConsentOpen(false)}
        title="Consentimiento informado"
        centered
        size="lg"
      >
        {data.consent_template ? (
          <ConsentCaptureForm
            template={data.consent_template}
            defaultName={data.consent?.guardian_name || student?.parent?.full_name || ''}
            defaultRelationship={
              data.consent?.guardian_relationship || student?.guardian_relationship || null
            }
            onSubmit={handleConsent}
            loading={createConsent.isPending}
            submitLabel="Registrar consentimiento"
          />
        ) : (
          <Text size="sm" c="dimmed">
            No hay una plantilla de consentimiento activa.
          </Text>
        )}
      </Modal>

      {/* Modal rechazo de documento */}
      <Modal
        opened={!!rejectDoc}
        onClose={() => setRejectDoc(null)}
        title="Rechazar documento"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Documento: <b>{rejectDoc?.label}</b>
          </Text>
          <Textarea
            label="Motivo"
            required
            minRows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRejectDoc(null)}>
              Cancelar
            </Button>
            <Button
              color="red"
              loading={updateDoc.isPending}
              disabled={!rejectReason.trim()}
              onClick={handleReject}
            >
              Rechazar documento
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}
