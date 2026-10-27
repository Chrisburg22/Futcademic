'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Grid,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCheck,
  IconDownload,
  IconExternalLink,
  IconFileText,
  IconRefresh,
  IconShieldCheck,
  IconUserPlus,
  IconX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { useAuth } from '../../contexts/AuthContext';
import { useGetCategories } from '../../hooks/useCategories';
import {
  useApproveEnrollmentApplication,
  useGetEnrollmentApplication,
  useRejectEnrollmentApplication,
  useReopenEnrollmentApplication,
  useReviewApplicationDocument,
} from '../../hooks/useEnrollment';
import { EnrollmentStatusBadge, relationshipLabel } from '../enrollment/labels';

function DataRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <Grid.Col span={{ base: 12, sm: 6 }}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="sm">{value || '—'}</Text>
    </Grid.Col>
  );
}

export function EnrollmentApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  const { data: application, isLoading, refetch } = useGetEnrollmentApplication(id);
  const { data: categories = [] } = useGetCategories();
  const approve = useApproveEnrollmentApplication();
  const reject = useRejectEnrollmentApplication();
  const reopen = useReopenEnrollmentApplication();
  const reviewDoc = useReviewApplicationDocument();

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveCategory, setApproveCategory] = useState<string | null>(null);
  const [validateTutorDocs, setValidateTutorDocs] = useState(true);
  const [approveResult, setApproveResult] = useState<any>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDoc, setRejectDoc] = useState<any>(null);
  const [rejectDocReason, setRejectDocReason] = useState('');

  if (isLoading) return <LoadingState />;
  if (!application) return <Text>Solicitud no encontrada</Text>;

  const docs = application.documents || [];
  const tutorDocs = docs.filter((d: any) => d.owner_type === 'tutor');
  const tutorDocsReady = ['identificacion_tutor_frente', 'identificacion_tutor_reverso'].every(
    (type) => docs.some((d: any) => d.doc_type === type),
  );
  const tutorDocsValidated = ['identificacion_tutor_frente', 'identificacion_tutor_reverso'].every(
    (type) =>
      docs.some((d: any) => d.doc_type === type && d.status === 'validado'),
  );
  const uploadedTypes = new Set(docs.map((d: any) => d.doc_type));
  const missingDocuments = (application.checklist || []).filter(
    (item: any) => item.required && !uploadedTypes.has(item.type),
  );

  const openApprove = () => {
    setApproveCategory(application.category_id);
    setValidateTutorDocs(!tutorDocsValidated);
    setApproveResult(null);
    setApproveOpen(true);
  };

  const handleApprove = async () => {
    try {
      const result = await approve.mutateAsync({
        id: application.id,
        category_id: approveCategory || undefined,
        validate_tutor_docs: validateTutorDocs,
      });
      setApproveResult(result);
      await refetch();
    } catch (err: any) {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.error || 'No se pudo aprobar la solicitud.',
      });
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await reject.mutateAsync({ id: application.id, reason: rejectReason.trim() });
      notifications.show({ color: 'green', message: 'Solicitud rechazada.' });
      setRejectOpen(false);
      setRejectReason('');
      await refetch();
    } catch (err: any) {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.error || 'No se pudo rechazar la solicitud.',
      });
    }
  };

  const handleReopen = async () => {
    try {
      const result = await reopen.mutateAsync(application.id);
      notifications.show({
        color: 'green',
        message: `Link reabierto hasta ${dayjs(result.expires_at).format('DD/MM/YYYY HH:mm')}.`,
      });
      await refetch();
    } catch (err: any) {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.error || 'No se pudo reabrir el link.',
      });
    }
  };

  const handleReviewDoc = async (
    doc: any,
    status: 'pendiente' | 'validado' | 'rechazado',
    reason?: string,
  ) => {
    try {
      await reviewDoc.mutateAsync({
        application_id: application.id,
        document_id: doc.id,
        status,
        rejection_reason: reason,
      });
      notifications.show({
        color: 'green',
        message:
          status === 'validado'
            ? 'Documento validado.'
            : status === 'rechazado'
              ? 'Documento rechazado.'
              : 'Documento marcado como pendiente.',
      });
      await refetch();
    } catch (err: any) {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.error || 'No se pudo actualizar el documento.',
      });
    }
  };

  const canApprove = application.status === 'enviada' && tutorDocsReady;
  const canReject = application.status === 'enviada' || application.status === 'rechazada';
  const canReopen = application.status === 'rechazada';

  return (
    <>
      <PageHeader
        title={application.student_full_name || 'Solicitud de inscripción'}
        description={`Categoría ${application.category?.name || '—'} · ${
          application.invitation?.note || 'Solicitud desde link'
        }`}
        actions={
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.push('/admin/enrollments')}
            >
              Volver
            </Button>
            {isAdmin && canReopen && (
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={handleReopen}
                loading={reopen.isPending}
              >
                Reabrir link
              </Button>
            )}
            {isAdmin && canReject && (
              <Button
                color="red"
                variant="light"
                leftSection={<IconX size={16} />}
                onClick={() => setRejectOpen(true)}
              >
                Rechazar
              </Button>
            )}
            {isAdmin && (
              <Button
                leftSection={<IconCheck size={16} />}
                onClick={openApprove}
                disabled={!canApprove}
              >
                Aprobar
              </Button>
            )}
          </Group>
        }
      />

      <Group gap="xs" mb="md">
        <EnrollmentStatusBadge status={application.status} size="md" />
        {application.category_mismatch && (
          <Badge color="yellow" variant="light" leftSection={<IconAlertTriangle size={12} />}>
            Fecha fuera de la categoría
          </Badge>
        )}
        {application.submitted_at && (
          <Text size="xs" c="dimmed">
            Enviada {dayjs(application.submitted_at).format('DD/MM/YYYY HH:mm')}
          </Text>
        )}
      </Group>

      {application.status === 'borrador' && (
        <Alert color="gray" variant="light" mb="md" icon={<IconFileText size={16} />}>
          El tutor todavía no envía la solicitud. Puede seguir editando el link.
        </Alert>
      )}

      {!tutorDocsReady && application.status === 'enviada' && (
        <Alert color="red" variant="light" mb="md" icon={<IconAlertTriangle size={16} />}>
          No se puede aprobar sin la identificación del tutor (frente y reverso).
          Rechaza la solicitud y reabre el link para que la cargue.
        </Alert>
      )}

      <Grid mb="md">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Card withBorder radius="md" padding="lg" h="100%">
            <Group gap="xs" mb="sm">
              <ThemeIcon variant="light" radius="md">
                <IconUserPlus size={18} />
              </ThemeIcon>
              <Text fw={600}>Datos del alumno</Text>
            </Group>
            <Grid>
              <DataRow label="Nombre" value={application.student_full_name} />
              <DataRow
                label="Fecha de nacimiento"
                value={
                  application.student_birth_date
                    ? dayjs(application.student_birth_date).format('DD/MM/YYYY')
                    : null
                }
              />
              <DataRow label="CURP" value={application.student_curp} />
              <DataRow label="Teléfono" value={application.student_phone} />
              <DataRow label="Domicilio" value={application.student_address} />
              <DataRow label="Contacto de emergencia" value={application.emergency_contact_name} />
              <DataRow label="Teléfono de emergencia" value={application.emergency_contact_phone} />
              <DataRow label="Notas médicas" value={application.medical_notes} />
            </Grid>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Card withBorder radius="md" padding="lg" h="100%">
            <Group gap="xs" mb="sm">
              <ThemeIcon variant="light" radius="md" color="violet">
                <IconShieldCheck size={18} />
              </ThemeIcon>
              <Text fw={600}>Tutor</Text>
            </Group>
            <Stack gap={6}>
              <Text size="sm" fw={600}>
                {application.guardian_full_name || '—'}
              </Text>
              <Text size="sm">
                {relationshipLabel(application.guardian_relationship)}
              </Text>
              <Anchor href={`mailto:${application.guardian_email}`} size="sm">
                {application.guardian_email || '—'}
              </Anchor>
              <Anchor href={`tel:${application.guardian_phone}`} size="sm">
                {application.guardian_phone || '—'}
              </Anchor>
              {application.guardian_address && (
                <Text size="sm" c="dimmed">
                  {application.guardian_address}
                </Text>
              )}
              {application.guardian_user_id && (
                <Badge variant="light" color="green" mt={4}>
                  Cuenta de tutor existente
                </Badge>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder radius="md" padding="lg" mb="md">
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <ThemeIcon variant="light" radius="md" color="green">
              <IconShieldCheck size={18} />
            </ThemeIcon>
            <Text fw={600}>Consentimiento informado</Text>
          </Group>
          {application.consent?.signed_pdf_url && (
            <Button
              component="a"
              href={application.consent.signed_pdf_url}
              target="_blank"
              rel="noreferrer"
              size="xs"
              variant="light"
              leftSection={<IconDownload size={14} />}
            >
              Ver PDF
            </Button>
          )}
        </Group>
        {application.consent ? (
          <Grid>
            <DataRow label="Firmado por" value={application.consent.guardian_name} />
            <DataRow
              label="Fecha de aceptación"
              value={dayjs(application.consent.accepted_at).format('DD/MM/YYYY HH:mm')}
            />
            <DataRow label="Versión del texto" value={application.consent.consent_version} />
            <DataRow label="IP" value={application.consent.ip} />
            <DataRow label="Dispositivo" value={application.consent.user_agent} />
            <DataRow
              label="Autorizaciones"
              value={
                [
                  application.consent.accepted_data && 'Datos',
                  application.consent.accepted_participation && 'Participación',
                  application.consent.accepted_medical && 'Médica',
                  application.consent.accepted_image && 'Imagen',
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'
              }
            />
          </Grid>
        ) : (
          <Text size="sm" c="dimmed">
            La solicitud todavía no tiene consentimiento firmado.
          </Text>
        )}
      </Card>

      <Card withBorder radius="md" padding={0} mb="md">
        <Group justify="space-between" p="lg" pb="sm">
          <Group gap="xs">
            <ThemeIcon variant="light" radius="md" color="blue">
              <IconFileText size={18} />
            </ThemeIcon>
            <Text fw={600}>Documentos</Text>
          </Group>
          {missingDocuments.length > 0 && (
            <Badge color="yellow" variant="light">
              Faltan {missingDocuments.length} del checklist
            </Badge>
          )}
        </Group>

        {docs.length === 0 ? (
          <Text size="sm" c="dimmed" px="lg" pb="lg">
            Sin documentos cargados.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={600}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Documento</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Cargado</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {docs.map((doc: any) => (
                  <Table.Tr key={doc.id}>
                    <Table.Td>
                      <Text size="sm" fw={600}>
                        {doc.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {doc.owner_type === 'tutor' ? 'Tutor' : 'Alumno'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <EnrollmentStatusBadge status={doc.status} />
                      {doc.rejection_reason && (
                        <Text size="xs" c="red" mt={2}>
                          {doc.rejection_reason}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {dayjs(doc.uploaded_at).format('DD/MM/YYYY HH:mm')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        {doc.signed_url && (
                          <Button
                            component="a"
                            href={doc.signed_url}
                            target="_blank"
                            rel="noreferrer"
                            size="compact-xs"
                            variant="subtle"
                            leftSection={<IconExternalLink size={14} />}
                          >
                            Ver
                          </Button>
                        )}
                        {isAdmin && application.status !== 'aprobada' && (
                          <>
                            <Button
                              size="compact-xs"
                              variant="light"
                              color="green"
                              onClick={() => handleReviewDoc(doc, 'validado')}
                            >
                              Validar
                            </Button>
                            <Button
                              size="compact-xs"
                              variant="light"
                              color="red"
                              onClick={() => {
                                setRejectDoc(doc);
                                setRejectDocReason('');
                              }}
                            >
                              Rechazar
                            </Button>
                          </>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}

        <Divider />
        <Stack gap={4} p="lg">
          <Text size="xs" c="dimmed">
            Checklist de liga: los documentos del alumno pueden quedar pendientes
            sin bloquear el alta. Solo la identificación del tutor es requisito
            para aprobar.
          </Text>
          {missingDocuments.length > 0 && (
            <Text size="xs" c="dimmed">
              Pendientes: {missingDocuments.map((d: any) => d.label).join(', ')}
            </Text>
          )}
        </Stack>
      </Card>

      <Card withBorder radius="md" padding="lg">
        <Title order={3} size="h5" mb="sm">
          Historial
        </Title>
        <Grid>
          <DataRow
            label="Creada"
            value={dayjs(application.created_at).format('DD/MM/YYYY HH:mm')}
          />
          <DataRow
            label="Enviada"
            value={
              application.submitted_at
                ? dayjs(application.submitted_at).format('DD/MM/YYYY HH:mm')
                : null
            }
          />
          <DataRow label="IP de envío" value={application.submitted_ip} />
          <DataRow label="Dispositivo de envío" value={application.submitted_user_agent} />
          <DataRow
            label="Revisada"
            value={
              application.reviewed_at
                ? dayjs(application.reviewed_at).format('DD/MM/YYYY HH:mm')
                : null
            }
          />
          <DataRow label="Reaperturas" value={String(application.reopen_count || 0)} />
        </Grid>
        {application.rejection_reason && (
          <Alert color="red" variant="light" mt="sm">
            Motivo de rechazo: {application.rejection_reason}
          </Alert>
        )}
      </Card>

      {/* Aprobar */}
      <Modal
        opened={approveOpen}
        onClose={() => setApproveOpen(false)}
        title={approveResult ? 'Solicitud aprobada' : 'Aprobar inscripción'}
        centered
        size="md"
      >
        {approveResult ? (
          <Stack gap="md">
            <Alert color="green" variant="light" icon={<IconCheck size={16} />}>
              Alumno dado de alta correctamente.
            </Alert>

            {approveResult.credentials ? (
              <Card withBorder radius="md" padding="md">
                <Text size="sm" fw={600} mb="xs">
                  Credenciales del alumno
                </Text>
                <Stack gap={4}>
                  <Text size="sm">
                    Usuario: <b>{approveResult.credentials.username}</b>
                  </Text>
                  <Text size="sm">
                    Contraseña temporal: <b>{approveResult.credentials.temp_password}</b>
                  </Text>
                </Stack>
                <Text size="xs" c="dimmed" mt="xs">
                  Entrégalas al alumno; deberá cambiarla al iniciar sesión.
                </Text>
              </Card>
            ) : (
              <Text size="sm" c="dimmed">
                La solicitud ya estaba vinculada a un alumno existente.
              </Text>
            )}

            <Text size="sm" c="dimmed">
              {approveResult.guardian_reused
                ? 'Se reutilizó la cuenta del tutor. '
                : 'Se creó la cuenta del tutor. '}
              {approveResult.guardian_email_sent
                ? 'Se envió el correo de activación.'
                : 'No se envió correo de activación (revisa SendGrid o reenvíalo desde Profesores).'}
            </Text>

            <Group justify="space-between">
              <Button variant="default" onClick={() => setApproveOpen(false)}>
                Cerrar
              </Button>
              <Button
                onClick={() => router.push(`/admin/students/${approveResult.student_id}`)}
              >
                Ver expediente del alumno
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="md">
            {!tutorDocsReady && (
              <Alert color="red" variant="light">
                Faltan la identificación del tutor o su reverso. No se puede
                aprobar.
              </Alert>
            )}

            <Select
              label="Categoría del alumno"
              data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
              value={approveCategory}
              onChange={setApproveCategory}
              searchable
            />
            {application.category_mismatch && (
              <Alert color="yellow" variant="light">
                La fecha de nacimiento no coincide con la categoría original.
                Verifica la categoría antes de aprobar.
              </Alert>
            )}

            <Checkbox
              checked={validateTutorDocs}
              onChange={(e) => setValidateTutorDocs(e.currentTarget.checked)}
              label="Marcar la identificación del tutor como validada"
              description="Si ya revisaste el frente y reverso, se validan al aprobar. Si no, valídalos en la tabla de documentos."
            />

            <Alert color="blue" variant="light">
              Los documentos del alumno pueden quedar pendientes. No bloquean el
              alta ni los entrenamientos; solo el paquete de liga.
            </Alert>

            <Group justify="flex-end">
              <Button variant="default" onClick={() => setApproveOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleApprove}
                loading={approve.isPending}
                disabled={!tutorDocsReady || (validateTutorDocs ? false : !tutorDocsValidated)}
              >
                Aprobar y crear alumno
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Rechazar solicitud */}
      <Modal
        opened={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Rechazar solicitud"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Explica qué debe corregir el tutor. El motivo se guarda en la bitácora
            y puedes reabrir el link después.
          </Text>
          <Textarea
            label="Motivo"
            required
            minRows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              color="red"
              onClick={handleReject}
              loading={reject.isPending}
              disabled={!rejectReason.trim()}
            >
              Rechazar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Rechazar documento */}
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
            value={rejectDocReason}
            onChange={(e) => setRejectDocReason(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRejectDoc(null)}>
              Cancelar
            </Button>
            <Button
              color="red"
              loading={reviewDoc.isPending}
              disabled={!rejectDocReason.trim()}
              onClick={async () => {
                if (!rejectDoc) return;
                await handleReviewDoc(rejectDoc, 'rechazado', rejectDocReason.trim());
                setRejectDoc(null);
              }}
            >
              Rechazar documento
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
