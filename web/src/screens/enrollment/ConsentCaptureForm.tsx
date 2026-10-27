'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Group,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconAlertCircle, IconLock } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import { RELATIONSHIP_OPTIONS } from './labels';
import classes from './consent.module.css';

export type ConsentPayload = {
  guardian_name: string;
  guardian_relationship?: string | null;
  accepted_data: boolean;
  accepted_participation: boolean;
  accepted_medical: boolean;
  accepted_image: boolean;
};

type Props = {
  template: { version: string; body_md: string; body_hash?: string | null };
  defaultName?: string;
  defaultRelationship?: string | null;
  onSubmit: (payload: ConsentPayload) => Promise<void> | void;
  loading?: boolean;
  submitLabel?: string;
};

/**
 * Captura de consentimiento informado.
 *
 * No es una firma electrónica certificada: guarda casillas, nombre escrito,
 * versión y hash del texto mostrado. La misma pieza se usa en el link remoto,
 * en el wizard presencial y en el expediente del alumno.
 */
export function ConsentCaptureForm({
  template,
  defaultName,
  defaultRelationship,
  onSubmit,
  loading,
  submitLabel = 'Aceptar y firmar',
}: Props) {
  const [guardianName, setGuardianName] = useState(defaultName || '');
  const [relationship, setRelationship] = useState<string | null>(
    defaultRelationship || null,
  );
  const [acceptedData, setAcceptedData] = useState(false);
  const [acceptedParticipation, setAcceptedParticipation] = useState(false);
  const [acceptedMedical, setAcceptedMedical] = useState(false);
  const [acceptedImage, setAcceptedImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!acceptedData || !acceptedParticipation || !acceptedMedical) {
      setError('Debes aceptar las tres autorizaciones obligatorias.');
      return;
    }
    if (!guardianName.trim()) {
      setError('Escribe el nombre completo de la persona tutora.');
      return;
    }
    setError(null);
    await onSubmit({
      guardian_name: guardianName.trim(),
      guardian_relationship: relationship,
      accepted_data: true,
      accepted_participation: true,
      accepted_medical: true,
      accepted_image: acceptedImage,
    });
  };

  return (
    <Stack gap="md">
      <Alert variant="light" color="gray" icon={<IconLock size={16} />}>
        Versión del texto <b>{template.version}</b>. Se guardará la fecha, hora,
        dirección IP y dispositivo como constancia. No es una firma electrónica
        certificada.
      </Alert>

      <ScrollArea h={260} type="auto" offsetScrollbars>
        <div className={classes.body}>
          <ReactMarkdown>{template.body_md}</ReactMarkdown>
        </div>
      </ScrollArea>

      <Stack gap="xs">
        <Checkbox
          checked={acceptedData}
          onChange={(e) => setAcceptedData(e.currentTarget.checked)}
          label="Autorizo el tratamiento de los datos personales del menor."
        />
        <Checkbox
          checked={acceptedParticipation}
          onChange={(e) => setAcceptedParticipation(e.currentTarget.checked)}
          label="Autorizo su participación en entrenamientos, partidos y traslados."
        />
        <Checkbox
          checked={acceptedMedical}
          onChange={(e) => setAcceptedMedical(e.currentTarget.checked)}
          label="Autorizo la atención médica de urgencia."
        />
        <Checkbox
          checked={acceptedImage}
          onChange={(e) => setAcceptedImage(e.currentTarget.checked)}
          label="Autorizo el uso de imagen (opcional)."
        />
      </Stack>

      <TextInput
        label="Nombre completo de la persona tutora"
        description="Escríbelo como firma. Quedará impreso en el PDF del consentimiento."
        placeholder="Nombre y apellidos"
        required
        value={guardianName}
        onChange={(e) => setGuardianName(e.currentTarget.value)}
      />

      <Select
        label="Parentesco con el alumno"
        placeholder="Selecciona"
        data={RELATIONSHIP_OPTIONS}
        value={relationship}
        onChange={setRelationship}
        clearable
      />

      {error && (
        <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      )}

      <Group justify="flex-end">
        <Button onClick={handleSubmit} loading={loading}>
          {submitLabel}
        </Button>
      </Group>
    </Stack>
  );
}
