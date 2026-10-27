'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { EnrollmentApplicationsPage } from '@/screens/admin/EnrollmentApplicationsPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin', 'profesor']}>
      <EnrollmentApplicationsPage />
    </ProtectedRoute>
  );
}
