import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { publicApi } from '../api/publicApi';

// ---------------------------------------------------------------------------
// Formulario público (token opaco en la URL)
// ---------------------------------------------------------------------------

export const usePublicEnrollment = (token: string) =>
  useQuery({
    queryKey: ['enrollment', 'public', token],
    queryFn: async () => (await publicApi.get(`/enrollment/${token}`)).data,
    enabled: !!token,
    retry: false,
    staleTime: 0,
  });

export const useSaveEnrollmentDraft = (token: string) =>
  useMutation({
    mutationFn: async (fields: Record<string, any>) =>
      (
        await publicApi.put(`/enrollment/${token}/draft`, fields)
      ).data as { draft: any; message: string },
  });

export const useUploadPublicEnrollmentDocument = (token: string) =>
  useMutation({
    mutationFn: async (payload: {
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
        await publicApi.post(`/enrollment/${token}/documents`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data as { document: any };
    },
  });

export const useSubmitEnrollment = (token: string) =>
  useMutation({
    mutationFn: async (payload: {
      fields: Record<string, any>;
      consent: {
        guardian_name: string;
        guardian_relationship?: string | null;
        accepted_data: boolean;
        accepted_participation: boolean;
        accepted_medical: boolean;
        accepted_image: boolean;
      };
    }) => (await publicApi.post(`/enrollment/${token}/submit`, payload)).data,
  });

/**
 * Descarga el PDF de consentimiento del link público. Se pide como blob porque
 * la ruta no es navegable sin el token en la URL; así también respetamos el
 * `no-referrer` de la página.
 */
export async function fetchPublicConsentPdf(token: string): Promise<Blob> {
  const response = await publicApi.get(`/enrollment/${token}/consent.pdf`, {
    responseType: 'blob',
  });
  return response.data as Blob;
}

// ---------------------------------------------------------------------------
// Administración: invitaciones y solicitudes
// ---------------------------------------------------------------------------

export const useCreateEnrollmentInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      category_id: string;
      expires_in_days?: number;
      note?: string;
    }) => (await api.post('/enrollment/invitations', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollment', 'invitations'] }),
  });
};

export const useGetEnrollmentInvitations = () =>
  useQuery({
    queryKey: ['enrollment', 'invitations'],
    queryFn: async () => (await api.get('/enrollment/invitations')).data,
  });

export const useRevokeEnrollmentInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/enrollment/invitations/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollment', 'invitations'] }),
  });
};

export const useGetEnrollmentApplications = (filters: {
  status?: string | null;
  category_id?: string | null;
}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.category_id) params.set('category_id', filters.category_id);
  const qs = params.toString();

  return useQuery({
    queryKey: ['enrollment', 'applications', filters.status || null, filters.category_id || null],
    queryFn: async () =>
      (await api.get(`/enrollment/applications${qs ? `?${qs}` : ''}`)).data,
  });
};

export const useGetEnrollmentApplication = (id?: string) =>
  useQuery({
    queryKey: ['enrollment', 'application', id],
    queryFn: async () => (await api.get(`/enrollment/applications/${id}`)).data,
    enabled: !!id,
  });

export const useApproveEnrollmentApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      category_id?: string;
      validate_tutor_docs?: boolean;
    }) =>
      (
        await api.post(`/enrollment/applications/${payload.id}/approve`, {
          category_id: payload.category_id,
          validate_tutor_docs: payload.validate_tutor_docs,
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useRejectEnrollmentApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; reason: string }) =>
      (await api.post(`/enrollment/applications/${payload.id}/reject`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollment'] }),
  });
};

export const useReopenEnrollmentApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/enrollment/applications/${id}/reopen`, {})).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollment'] }),
  });
};

export const useReviewApplicationDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      application_id: string;
      document_id: string;
      status: 'pendiente' | 'validado' | 'rechazado';
      rejection_reason?: string;
    }) =>
      (
        await api.patch(
          `/enrollment/applications/${payload.application_id}/documents/${payload.document_id}`,
          { status: payload.status, rejection_reason: payload.rejection_reason },
        )
      ).data,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['enrollment', 'application', variables.application_id] });
      qc.invalidateQueries({ queryKey: ['enrollment', 'applications'] });
    },
  });
};

export const useGetConsentTemplate = (enabled = true) =>
  useQuery({
    queryKey: ['enrollment', 'consent-template'],
    queryFn: async () => (await api.get('/enrollment/consent-template')).data,
    enabled,
  });
