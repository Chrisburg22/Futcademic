import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { saveBlob } from '../lib/download';

export const useGetStudentExpediente = (studentId?: string) =>
  useQuery({
    queryKey: ['students', 'expediente', studentId],
    queryFn: async () => (await api.get(`/students/${studentId}/expediente`)).data,
    enabled: !!studentId,
  });

export const useCreateStudentConsent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      studentId: string;
      guardian_name: string;
      guardian_relationship?: string | null;
      guardian_email?: string | null;
      guardian_phone?: string | null;
      accepted_data: boolean;
      accepted_participation: boolean;
      accepted_medical: boolean;
      accepted_image: boolean;
    }) => {
      const { studentId, ...body } = payload;
      return (await api.post(`/students/${studentId}/consent`, body)).data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['students', 'expediente', variables.studentId] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useUploadStudentDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      studentId: string;
      file: File;
      doc_type: string;
      owner_type: 'alumno' | 'tutor';
      expires_at?: string | null;
    }) => {
      const fd = new FormData();
      fd.append('file', payload.file);
      fd.append('doc_type', payload.doc_type);
      fd.append('owner_type', payload.owner_type);
      if (payload.expires_at) fd.append('expires_at', payload.expires_at);
      return (
        await api.post(`/students/${payload.studentId}/documents`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['students', 'expediente', variables.studentId] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useUpdateStudentDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      studentId: string;
      documentId: string;
      status: 'pendiente' | 'validado' | 'rechazado';
      rejection_reason?: string;
      expires_at?: string | null;
    }) => {
      const { studentId, documentId, ...body } = payload;
      return (await api.patch(`/students/${studentId}/documents/${documentId}`, body)).data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['students', 'expediente', variables.studentId] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useDeleteStudentDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { studentId: string; documentId: string }) =>
      api.delete(`/students/${payload.studentId}/documents/${payload.documentId}`),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['students', 'expediente', variables.studentId] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useReuseTutorDocuments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) =>
      (await api.post(`/students/${studentId}/documents/reuse-tutor`, {})).data,
    onSuccess: (_, studentId) => {
      qc.invalidateQueries({ queryKey: ['students', 'expediente', studentId] });
    },
  });
};

export const useTutorDocumentAvailability = (studentId?: string, enabled = true) =>
  useQuery({
    queryKey: ['students', 'tutor-documents', studentId],
    queryFn: async () =>
      (await api.get(`/students/${studentId}/tutor-documents/availability`)).data as {
        available: boolean;
      },
    enabled: !!studentId && enabled,
  });

// ---------------------------------------------------------------------------
// Descargas autenticadas
// ---------------------------------------------------------------------------

export async function downloadConsentPdf(studentId: string, filename = 'consentimiento.pdf') {
  const response = await api.get(`/students/${studentId}/consent.pdf`, {
    responseType: 'blob',
  });
  saveBlob(response.data as Blob, filename);
}

export async function downloadExpedientePackage(studentId: string, filename = 'paquete-liga.zip') {
  const response = await api.get(`/students/${studentId}/expediente/package`, {
    responseType: 'blob',
  });
  saveBlob(response.data as Blob, filename);
}
