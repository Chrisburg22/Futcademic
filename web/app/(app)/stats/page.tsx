'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { StatsPage } from '@/screens/StatsPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['alumno']}>
      <StatsPage />
    </ProtectedRoute>
  );
}
