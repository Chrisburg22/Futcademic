'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { CategoryDetailPage } from '@/screens/admin/CategoryDetailPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin', 'profesor']}>
      <CategoryDetailPage />
    </ProtectedRoute>
  );
}
