'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { FinancesPage } from '@/screens/FinancesPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin', 'padre']}>
      {/* La pantalla lee el periodo y la vista de la query con
          `useSearchParams` (enlaces como /finances?tab=cobranza), que necesita
          un límite de Suspense para poder prerenderizar la ruta. */}
      <Suspense fallback={null}>
        <FinancesPage />
      </Suspense>
    </ProtectedRoute>
  );
}
