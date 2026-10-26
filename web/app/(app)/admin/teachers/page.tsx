'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { TeachersPage } from '@/screens/admin/TeachersPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin']}>
      <TeachersPage />
    </ProtectedRoute>
  );
}
