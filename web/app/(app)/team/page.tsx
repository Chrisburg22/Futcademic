'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { TeamPage } from '@/screens/TeamPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['alumno']}>
      <TeamPage />
    </ProtectedRoute>
  );
}
