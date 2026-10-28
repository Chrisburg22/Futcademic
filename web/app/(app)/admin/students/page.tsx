'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { StudentsPage } from '@/screens/admin/StudentsPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin', 'profesor']}>
      {/* El listado lee los filtros de la query con `useSearchParams`, que
          necesita un límite de Suspense para poder prerenderizar la ruta. */}
      <Suspense fallback={null}>
        <StudentsPage />
      </Suspense>
    </ProtectedRoute>
  );
}
