'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { TeacherDetailPage } from '@/screens/admin/TeacherDetailPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin']}>
      <TeacherDetailPage />
    </ProtectedRoute>
  );
}
