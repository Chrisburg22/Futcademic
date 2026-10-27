'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { EnrollmentApplicationDetailPage } from '@/screens/admin/EnrollmentApplicationDetailPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin', 'profesor']}>
      <EnrollmentApplicationDetailPage />
    </ProtectedRoute>
  );
}
