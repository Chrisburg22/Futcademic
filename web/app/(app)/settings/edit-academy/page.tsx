'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { EditAcademyPage } from '@/screens/settings/EditAcademyPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin']}>
      <EditAcademyPage />
    </ProtectedRoute>
  );
}
