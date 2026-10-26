'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { FinancesPage } from '@/screens/FinancesPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin', 'padre']}>
      <FinancesPage />
    </ProtectedRoute>
  );
}
