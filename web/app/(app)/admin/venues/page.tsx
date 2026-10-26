'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { VenuesPage } from '@/screens/admin/VenuesPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin']}>
      <VenuesPage />
    </ProtectedRoute>
  );
}
