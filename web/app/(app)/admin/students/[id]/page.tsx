'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { StudentDetailPage } from '@/screens/admin/StudentDetailPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin', 'profesor']}>
      <StudentDetailPage />
    </ProtectedRoute>
  );
}
