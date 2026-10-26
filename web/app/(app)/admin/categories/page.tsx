'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { CategoriesPage } from '@/screens/admin/CategoriesPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin']}>
      <CategoriesPage />
    </ProtectedRoute>
  );
}
