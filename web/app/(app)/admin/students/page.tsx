'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { StudentsPage } from '@/screens/admin/StudentsPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin', 'profesor']}>
      <StudentsPage />
    </ProtectedRoute>
  );
}
